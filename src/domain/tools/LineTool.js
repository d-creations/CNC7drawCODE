import { BaseTool } from "./BaseTool.js";
import { Point } from "../shapes/Point.js";
import { DrawLine } from "../shapes/DrawLine.js";
import { Vec4 } from "../Camera.js";

/**
 * Tool for creating standard constrained Lines.
 */
export class LineTool extends BaseTool {
    constructor(drawBoard, constraintSystem) {
        super(drawBoard);
        this.constraintSystem = constraintSystem;
        this.startPointId = null;
        this.startPointObj = null;
    }

    onCanvasClick(x, y) {
        // If the user clicked on an existing Point, reuse it!
        let snapped = this.drawBoard.selectStartObject(x, y, ["Point"]);
        let ptId, pObj;


        if (snapped.exist && snapped.obj && snapped.obj.constructor.name === "Point") {
            pObj = snapped.obj;
            ptId = pObj.constraintId;
        } else {
            // Convert screen pixel coordinates into world coordinate offsets!
            let worldVec = this.drawBoard.camera.getWorldVec(x, y);

            // 1. Create a Point in the Constraint System
            ptId = this.constraintSystem.addGeometry({
                type: "Point",
                data: { x: worldVec.x, y: worldVec.y },
                fixed: false
            });

            // 2. Create the visual Point object
            pObj = new Point(new Vec4(worldVec.x, worldVec.y, 0, 1));
            pObj.constraintId = ptId;
            this.drawBoard.drawObjects.push(pObj);
        }

        if (!this.startPointId) {
            // First click: Register start point
            this.startPointId = ptId;
            this.startPointObj = pObj;
        } else {
            // Second click: Register end point & create the Line
            let lineId = this.constraintSystem.addGeometry({
                type: "Line",
                data: { start: this.startPointId, end: ptId },
                fixed: false
            });

            // Create the visual Line object
            let lObj = new DrawLine(this.startPointObj, pObj);
            lObj.constraintId = lineId;
            this.drawBoard.drawObjects.push(lObj);

            // Reset tool state to allow drawing the next line
            this.startPointId = null;
            this.startPointObj = null;
        }

        this.drawBoard.draw(); // Fix: Force immediate render
    }
}
