import { BaseShape } from "./BaseShape.js";

export class Point extends BaseShape {
    vec4;
    type = "Point";

    constructor(vec4) {
        super();
        this.vec4 = vec4;
    }

    get x() { return this.vec4.x; }
    set x(val) { this.vec4.x = val; }
    get y() { return this.vec4.y; }
    set y(val) { this.vec4.y = val; }

    getRenderData() {
        // Shapes highlight in green or purple during selection/operations
        const isHoveredOrSelected = this.color !== this.defaultColor && this.color !== "red"; 
        const isStandalone = this.isExplicit === true && this.isAttachedToShape !== true;
        
        const shouldBeVisible = isHoveredOrSelected || isStandalone;

        if (!shouldBeVisible) {
            // Keep structural endpoints subtle by default, but still easy to hover precisely.
            return [
                {
                    primitive: 'arc',
                    worldX: this.vec4.x,
                    worldY: this.vec4.y,
                    hitFromCenter: true,
                    radius: 1.25,
                    color: this.color,
                    fill: true,
                    stroke: false,
                    lineWidth: 1
                }
            ];
        }
        
        return [
            {
                primitive: 'arc',
                worldX: this.vec4.x,
                worldY: this.vec4.y,
                hitFromCenter: true,
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