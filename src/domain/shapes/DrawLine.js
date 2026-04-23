import { BaseShape } from "./BaseShape.js";
import { Point } from "./Point.js";

export class DrawLine extends BaseShape {
    startPoint;
    endpoint;

    constructor(ctx, camera, startPoint, endpoint) {
        super(ctx, camera);
        this.startPoint = startPoint;
        this.endpoint = endpoint;
    }

    draw() {
        let startPointcameraVec4 = this.startPoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        let endPointcameraVec4 = this.endpoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        
        this.ctx.beginPath();
        this.ctx.moveTo(startPointcameraVec4.x, startPointcameraVec4.y);
        this.ctx.lineTo(endPointcameraVec4.x, endPointcameraVec4.y);
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();
    }

    check(x, y) {
        let startCam = this.startPoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        let endCam = this.endpoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        
        let xV_ = endCam.x - startCam.x;
        let yV_ = endCam.y - startCam.y;
        let x2 = x - startCam.x;
        let y2 = y - startCam.y;
        
        let SkalarPS = (xV_ * x2 + yV_ * y2) / (Math.sqrt(xV_ * xV_ + yV_ * yV_) * Math.sqrt(x2 * x2 + y2 * y2)) || 0;
        let distanceP = (xV_ * y2 - yV_ * x2) / Math.sqrt(xV_ * xV_ + yV_ * yV_) || 0;
        
        x2 = x - endCam.x;
        y2 = y - endCam.y;
        let SkalarPE = (-xV_ * x2 - yV_ * y2) / (Math.sqrt(xV_ * xV_ + yV_ * yV_) * Math.sqrt(x2 * x2 + y2 * y2)) || 0;
        
        if (SkalarPE < 0 || SkalarPS < 0) {
            distanceP = 99999;
        }
        return Math.abs(distanceP);
    }

    buildProperties(editor) {
        editor.buildPointFields(this.startPoint, "Start Point");
        editor.buildPointFields(this.endpoint, "End Point");
    }
}