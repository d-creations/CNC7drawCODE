import { BaseShape } from "./BaseShape.js";

export class Point extends BaseShape {
    vec4;

    constructor(ctx, camera, vec4) {
        super(ctx, camera);
        this.vec4 = vec4;
    }

    draw() {
        let cameraVec4 = this.vec4.mulMatrix(this.camera.getCalcMatrix());
        this.ctx.beginPath();
        this.ctx.arc(cameraVec4.x, cameraVec4.y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.color;
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = this.color;
        this.ctx.fill();
        this.ctx.stroke();
    }

    check(x, y) {
        let cameraVec4 = this.vec4.mulMatrix(this.camera.getCalcMatrix());
        let x_ = x - cameraVec4.x;
        let y_ = y - cameraVec4.y;
        return Math.sqrt(x_ * x_ + y_ * y_);
    }

    /** Ask the PropertyEditor to render this shape's specific properties */
    buildProperties(editor) {
        editor.buildPointFields(this, "Position");
    }

    static resolve(drawBoard, ptParam, isTemp = false) {
        if (ptParam.exist) return ptParam.obj;
        let vec = drawBoard.camera.getWorldVec(ptParam.x, ptParam.y);
        let ptObj = new Point(drawBoard.context, drawBoard.camera, vec);
        
        if (isTemp) {
            drawBoard.drawTempObjects.push(ptObj);
            // DO NOT cache a temporary point into the ptParam, otherwise the final object will reference a cleared temporary point!
        } else {
            drawBoard.drawObjects.push(ptObj);
            ptParam.obj = ptObj;
            ptParam.exist = true;
        }
        return ptObj;
    }

    static create(drawBoard, ptParam) {
        Point.resolve(drawBoard, ptParam, false);
        drawBoard.draw();
    }
}