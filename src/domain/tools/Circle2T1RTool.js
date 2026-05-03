import { BaseTool } from "./BaseTool.js";
import { Geometry } from "../math/Geometry.js";
import { Point } from "../shapes/Point.js";
import { DrawCircle } from "../shapes/DrawCircle.js";
import { GeometricTangentShape } from "../shapes/GeometricTangentShape.js";
import { Vec4 } from '../viewController/Camera.js';

/**
 * Tool for creating a Circle constrained by 2 Lines and a fixed Radius.
 * REPLACES: The old `DrawCircle2T1R` shape class
 */
export class Circle2T1RTool extends BaseTool {
    constructor(drawBoard, constraintSystem) {
        super(drawBoard);
        this.constraintSystem = constraintSystem;
        this.selectedLines = [];
        this.selectedVisualLines = [];
        this.step = "selectLines"; // "selectLines" | "placeRadiusHint"
        this.tempRadius = null;
    }

    /**
     * Fired by drawboard when a shape is clicked.
     */
    onShapeSelected(shapeClicked) {
        if (this.step !== "selectLines") return;
        if (!["DrawLine", "DrawCircle"].includes(shapeClicked.constructor.name)) return;

        let lineId = shapeClicked.constraintId || "temp_line_id"; 
        
        this.selectedLines.push(lineId);
        this.selectedVisualLines.push(shapeClicked);
        shapeClicked.changeColor("orange");
        this.drawBoard.draw();

        if (this.selectedLines.length === 2) {
            this.step = "placeRadiusHint";
            console.log("2 Lines selected. Click anywhere to define the radius size and quadrant hint.");
        }
    }

    /**
     * Fired by drawboard when empty Canvas is clicked.
     */
    onCanvasClick(x, y) {
        if (this.step !== "placeRadiusHint") return;

        let worldVec = this.drawBoard.camera.getWorldVec(x, y);
        let hintPoint = new Vec4(worldVec.x, worldVec.y, 0, 1);
        let dist = Geometry.pointToLineDistance({x: worldVec.x, y: worldVec.y}, this.selectedVisualLines[0]);
        this.tempRadius = dist; // The distance to the first line is our requested radius
        
        this.generateConstrainedCircle(hintPoint);

        // Reset
        this.selectedVisualLines.forEach(l => l.changeColor("red"));
        this.selectedLines = [];
        this.selectedVisualLines = [];
        this.step = "selectLines";
        this.tempRadius = null;
    }

    generateConstrainedCircle(hintPoint) {
        let [l1Id, l2Id] = this.selectedLines;

        // 1. Math Library provides initial guess based on hint quadrant
        let startCirc = Geometry.getCircleCenter2T1R(
            this.selectedVisualLines[0], 
            this.selectedVisualLines[1], 
            this.tempRadius, 
            hintPoint
        );

        if (startCirc.r === 0) {
            console.error("Parallel lines cannot form a 2T Circle");
            return;
        }

        // 2. Build constraint primitives
        let centerId = this.constraintSystem.addGeometry({
            type: "Point",
            data: { x: startCirc.x, y: startCirc.y },
            fixed: false
        });

        let circId = this.constraintSystem.addGeometry({
            type: "Circle",
            data: { center: centerId, r: startCirc.r },
            fixed: false // The circle center can move...
        });

        // 3. Add Rules: 2 Tangents + 1 Fixed Radius
        let link1Id = this.constraintSystem.addGeometry({ type: "GeometricTangent", data: { target1Id: l1Id, target2Id: circId }, fixed: false });
        let link2Id = this.constraintSystem.addGeometry({ type: "GeometricTangent", data: { target1Id: l2Id, target2Id: circId }, fixed: false });
        
        this.constraintSystem.addConstraint({ type: "Tangent", targets: [l1Id, circId], geometryId: link1Id });
        this.constraintSystem.addConstraint({ type: "Tangent", targets: [l2Id, circId], geometryId: link2Id });
        
        // This is a special constraint that forces the Circle's radius to remain exactly what we requested
        this.constraintSystem.addConstraint({ type: "Radius", targets: [circId], value: startCirc.r });

        // 4. Finally, tell the view to render it
        let pObj = new Point(new Vec4(startCirc.x, startCirc.y, 0, 1));
        pObj.constraintId = centerId;
        let cObj = new DrawCircle(pObj, startCirc.r);
        cObj.constraintId = circId;
        this.drawBoard.drawObjects.push(pObj);
        this.drawBoard.drawObjects.push(cObj);

        let t1 = new GeometricTangentShape(this.drawBoard, this.selectedVisualLines[0], cObj); t1.constraintId = link1Id;
        let t2 = new GeometricTangentShape(this.drawBoard, this.selectedVisualLines[1], cObj); t2.constraintId = link2Id;
        this.drawBoard.drawObjects.push(t1, t2);

        this.drawBoard.draw();
        console.log("2-Tangent 1-Radius Circle Created via Constraints!");
    }
}