import { BaseShape } from "./BaseShape.js";
import { Point } from "./Point.js";

export class DrawLine extends BaseShape {
    startPoint;
    endpoint;

    constructor(startPoint, endpoint) {
        super();
        this.startPoint = startPoint;
        this.endpoint = endpoint;
    }

    getRenderData() {
        if (!this.startPoint || !this.startPoint.vec4 || !this.endpoint || !this.endpoint.vec4) {
            // Defensive: skip rendering if points are not valid
            return [];
        }
        return [
            {
                primitive: 'line',
                worldStartX: this.startPoint.vec4.x,
                worldStartY: this.startPoint.vec4.y,
                worldEndX: this.endpoint.vec4.x,
                worldEndY: this.endpoint.vec4.y,
                color: this.color
            }
        ];
    }



    buildProperties(editor) {
        editor.buildPointFields(this.startPoint, "Start Point");
        editor.buildPointFields(this.endpoint, "End Point");
    }
}