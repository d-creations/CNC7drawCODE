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

    getRenderData() {
        return [
            {
                primitive: 'arc',
                worldX: this.vec4.x,
                worldY: this.vec4.y,
                radius: 5,
                color: this.color,
                fill: true,
                stroke: true,
                lineWidth: 4
            }
        ];
    }

    check(x, y) {
        let cameraVec4 = this.vec4.mulMatrix(this.camera.getCalcMatrix());
        let x_ = x - cameraVec4.x;
        let y_ = y - cameraVec4.y;
        return Math.sqrt(x_ * x_ + y_ * y_);
    }

    checkInsideArea(minX, minY, maxX, maxY, requireComplete) {
        let camPos = this.vec4.mulMatrix(this.camera.getCalcMatrix());
        return camPos.x >= minX && camPos.x <= maxX && camPos.y >= minY && camPos.y <= maxY;
    }

    /** Ask the PropertyEditor to render this shape's specific properties */
    buildProperties(editor) {
        editor.buildPointFields(this, "Position");
    }
}