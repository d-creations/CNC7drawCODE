import { BaseTool } from "./BaseTool.js";
import { Geometry } from "../math/Geometry.js";
import { Point } from "../shapes/Point.js";
import { DrawCircle } from "../shapes/DrawCircle.js";
import { Vec4 } from '../viewController/Camera.js';

/**
 * Tool for creating a Circle from 3 Points.
 * REPLACES: The old `DrawCircle3P` shape class.
 */
export class Circle3PTool extends BaseTool {
    constructor(drawBoard, constraintSystem) {
        super(drawBoard);
        this.constraintSystem = constraintSystem;
        
        // Tool state
        this.selectedPoints = [];
    }

    /**
     * Triggered by the Canvas when this tool is active and the user clicks.
     */
    onCanvasClick(x, y) {
        // If the user clicked on an existing Point, reuse it!
        let snapped = this.drawBoard.selectStartObject(x, y, ["Point"]);
        let ptId;

        if (snapped.exist && snapped.obj && snapped.obj.constructor.name === "Point") {
            ptId = snapped.obj.constraintId;
        } else {
            // Convert screen pixel coordinates into world coordinate offsets!
            let worldVec = this.drawBoard.camera.getWorldVec(x, y);

            // Resolve clicked location into a tracked Point geometry
            ptId = this.constraintSystem.addGeometry({
                type: "Point",
                data: { x: worldVec.x, y: worldVec.y },
                fixed: false 
            });

            // Create visual representation for the new point
            let pObj = new Point(new Vec4(worldVec.x, worldVec.y, 0, 1));
            pObj.constraintId = ptId;
            this.drawBoard.drawObjects.push(pObj);
        }

        this.selectedPoints.push(ptId);

        // 2. If we have 3 points, calculate and generate the Circle + Constraints
        if (this.selectedPoints.length === 3) {
            this.generateConstrainedCircle();
            
            // Reset tool state for the next circle
            this.selectedPoints = []; 
        }
        
        this.drawBoard.draw();
    }

    generateConstrainedCircle() {
        let [p1Id, p2Id, p3Id] = this.selectedPoints;
        
        let p1 = this.constraintSystem.geometries.get(p1Id).data;
        let p2 = this.constraintSystem.geometries.get(p2Id).data;
        let p3 = this.constraintSystem.geometries.get(p3Id).data;

        // A. Use Geometry.js to find the exact mathematical starting coordinates
        let startCirc = Geometry.getCircumcenter(p1, p2, p3);

        // B. Create the primitive center point and circle geometries
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

        // C. Apply the CAD Constraints bridging everything together
        this.constraintSystem.addConstraint({
            type: "Coincident", targets: [p1Id, circId]
        });
        this.constraintSystem.addConstraint({
            type: "Coincident", targets: [p2Id, circId]
        });
        this.constraintSystem.addConstraint({
            type: "Coincident", targets: [p3Id, circId]
        });

        // D. Create visual representations for the center and the circle itself
        let pObj = new Point(new Vec4(startCirc.x, startCirc.y, 0, 1));
        pObj.constraintId = centerId;
        let cObj = new DrawCircle(pObj, startCirc.r);
        cObj.constraintId = circId;

        this.drawBoard.drawObjects.push(pObj);
        this.drawBoard.drawObjects.push(cObj);

        console.log("3-Point Circle Created via Constraints!");
    }
}
