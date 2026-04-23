import { BaseShape } from "./BaseShape.js";

export class Point extends BaseShape {
    vec4;

    constructor(ctx, camera, vec4) {
        super(ctx, camera);
        this.vec4 = vec4;
    }

    get x() { return this.vec4.x; }
    set x(val) { this.vec4.x = val; }
    get y() { return this.vec4.y; }
    set y(val) { this.vec4.y = val; }

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
}