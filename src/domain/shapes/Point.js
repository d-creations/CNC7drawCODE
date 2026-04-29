import { BaseShape } from "./BaseShape.js";

export class Point extends BaseShape {
    vec4;

    constructor(vec4) {
        super();
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



    /** Ask the PropertyEditor to render this shape's specific properties */
    buildProperties(editor) {
        editor.buildPointFields(this, "Position");
    }
}