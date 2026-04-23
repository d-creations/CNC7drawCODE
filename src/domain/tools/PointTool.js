import { BaseTool } from "./BaseTool.js";
import { Point } from "../shapes/Point.js";
import { Vec4 } from "../Camera.js";

/**
 * Tool for creating standard constrained Points.
 */
export class PointTool extends BaseTool {
    constructor(drawBoard, constraintSystem) {
        super(drawBoard);
        this.constraintSystem = constraintSystem;
    }

    onCanvasClick(x, y) {
        // Convert screen pixel coordinates into world coordinate offsets!
        let worldVec = this.drawBoard.camera.getWorldVec(x, y);

        // 1. Math Data Layer
        let ptId = this.constraintSystem.addGeometry({
            type: "Point",
            data: { x: worldVec.x, y: worldVec.y },
            fixed: false
        });

        // 2. Visual View Layer
        let pObj = new Point(this.drawBoard.context, this.drawBoard.camera, new Vec4(worldVec.x, worldVec.y, 0, 1));
        pObj.constraintId = ptId;
        
        this.drawBoard.drawObjects.push(pObj);
        this.drawBoard.draw(); // Fix: Force immediate render
    }
}