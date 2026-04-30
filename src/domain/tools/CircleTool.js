import { BaseTool } from "./BaseTool.js";
import { Point } from "../shapes/Point.js";
import { DrawCircle } from "../shapes/DrawCircle.js";
import { Vec4 } from "../Camera.js";

/**
 * Tool for creating a standard Circle from center point and radius (by dragging).
 */
export class CircleTool extends BaseTool {
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
            ptId = this.constraintSystem.addGeometry({
                type: "Point",
                data: { x: worldVec.x, y: worldVec.y },
                fixed: false
            });
            pObj = new Point(new Vec4(worldVec.x, worldVec.y, 0, 1));
            pObj.constraintId = ptId;
            this.drawBoard.drawObjects.push(pObj);
        }

        if (!this.startPointId) {
            // First click: Register center point
            this.startPointId = ptId;
            this.startPointObj = pObj;
        } else {
            // Second click: Register edge point & create the Circle
            let worldVec = this.drawBoard.camera.getWorldVec(x, y);
            let centerVec = this.startPointObj.vec4;
            let dist = Math.sqrt(Math.pow(worldVec.x - centerVec.x, 2) + Math.pow(worldVec.y - centerVec.y, 2));
            let circId = this.constraintSystem.addGeometry({
                type: "Circle",
                data: { center: this.startPointId, r: dist },
                fixed: false
            });
            let cObj = new DrawCircle(this.startPointObj, dist);
            cObj.constraintId = circId;
            this.drawBoard.drawObjects.push(cObj);
            // Reset tool state to allow drawing the next circle
            this.startPointId = null;
            this.startPointObj = null;
        }
        this.drawBoard.draw();
    }
}
