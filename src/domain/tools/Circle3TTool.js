import { BaseTool } from "./BaseTool.js";
import { Geometry } from "../math/Geometry.js";
import { Point } from "../shapes/Point.js";
import { DrawCircle } from "../shapes/DrawCircle.js";
import { Vec4 } from "../Camera.js";

/**
 * Tool for creating a fully constrained Circle from 3 Lines (Tangents).
 * REPLACES: The old `DrawCircle3T` class
 */
export class Circle3TTool extends BaseTool {
    constructor(drawBoard, constraintSystem) {
        super(drawBoard);
        this.constraintSystem = constraintSystem;
        this.selectedLines = [];
        this.selectedVisualLines = [];
    }

    /**
     * Called when user clicks an existing shape on the Canvas.
     */
    onShapeSelected(shapeClicked) {
        if (!["DrawLine", "DrawCircle"].includes(shapeClicked.constructor.name)) return;

        // We assume your canvas hit-selection gives you the DrawLine object.
        // We'll need a way to link `DrawLine` UI shapes to their JSON Constraint Id.
        // For this example, let's assume `shapeClicked.constraintId` holds the JSON linkage.
        let lineId = shapeClicked.constraintId || "temp_line_id"; 
        
        this.selectedLines.push(lineId);
        this.selectedVisualLines.push(shapeClicked);
        shapeClicked.changeColor("orange"); // selection visual feedback
        this.drawBoard.draw();

        if (this.selectedLines.length === 3) {
            this.generateConstrainedCircle();
            this.selectedLines = [];
            this.selectedVisualLines.forEach(l => l.changeColor("red")); // restore
            this.selectedVisualLines = [];
        }
    }

    generateConstrainedCircle() {
        let [l1Id, l2Id, l3Id] = this.selectedLines;
        
        // 1. Math Library provides the exact start guessing coordinate
        let startCirc = Geometry.getCircleCenter3T(
            this.selectedVisualLines[0], 
            this.selectedVisualLines[1], 
            this.selectedVisualLines[2]
        );

        if (startCirc.r === 0) {
            console.error("Parallel lines cannot form a 3T Circle");
            return;
        }

        // 2. Generate generic Point (Center) & Circle primitives in the Solver
        let centerId = this.constraintSystem.addGeometry({
            type: "Point",
            data: { x: startCirc.x, y: startCirc.y },
            fixed: false
        });

        let circId = this.constraintSystem.addGeometry({
            type: "Circle",
            data: { center: centerId, r: startCirc.r },
            fixed: false
        });

        // 3. Add Tangent Rules to tie it to the requested 3 Lines
        this.constraintSystem.addConstraint({ type: "Tangent", targets: [l1Id, circId] });
        this.constraintSystem.addConstraint({ type: "Tangent", targets: [l2Id, circId] });
        this.constraintSystem.addConstraint({ type: "Tangent", targets: [l3Id, circId] });

        // 4. Finally, tell the view to render it (Instantiate standard DrawCircle linked to the JSON center!)
        let pObj = new Point(new Vec4(startCirc.x, startCirc.y, 0, 1));
        pObj.constraintId = centerId; // link them
        let cObj = new DrawCircle(pObj, startCirc.r);
        cObj.constraintId = circId; // link them
        this.drawBoard.drawObjects.push(pObj);
        this.drawBoard.drawObjects.push(cObj);
        this.drawBoard.draw();
        console.log("3-Tangent Circle Created via Constraints!");
    }
}
