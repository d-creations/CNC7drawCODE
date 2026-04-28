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

    getRenderData() {
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

    check(x, y) {
        let startCam = this.startPoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        let endCam = this.endpoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        
        let dx = endCam.x - startCam.x;
        let dy = endCam.y - startCam.y;
        
        let len2 = dx * dx + dy * dy;
        if (len2 === 0) {
            let distX = x - startCam.x;
            let distY = y - startCam.y;
            return Math.sqrt(distX * distX + distY * distY);
        }
        
        let t = ((x - startCam.x) * dx + (y - startCam.y) * dy) / len2;
        t = Math.max(0, Math.min(1, t)); // constrain to the line segment

        let closestX = startCam.x + t * dx;
        let closestY = startCam.y + t * dy;

        let distX = x - closestX;
        let distY = y - closestY;

        return Math.sqrt(distX * distX + distY * distY);
    }

    checkInsideArea(minX, minY, maxX, maxY, requireComplete) {
        let startCam = this.startPoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        let endCam = this.endpoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        
        let isInside = (x, y) => x >= minX && x <= maxX && y >= minY && y <= maxY;
        let startIn = isInside(startCam.x, startCam.y);
        let endIn = isInside(endCam.x, endCam.y);

        if (requireComplete) {
            return startIn && endIn;
        } else {
            if (startIn || endIn) return true;
            
            // Check line segment intersection with 4 bounding box borders
            let lineIntersects = (x1, y1, x2, y2, x3, y3, x4, y4) => {
                let uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
                let uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
                return (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1);
            };

            if (lineIntersects(startCam.x, startCam.y, endCam.x, endCam.y, minX, minY, maxX, minY)) return true; // Top
            if (lineIntersects(startCam.x, startCam.y, endCam.x, endCam.y, minX, maxY, maxX, maxY)) return true; // Bottom
            if (lineIntersects(startCam.x, startCam.y, endCam.x, endCam.y, minX, minY, minX, maxY)) return true; // Left
            if (lineIntersects(startCam.x, startCam.y, endCam.x, endCam.y, maxX, minY, maxX, maxY)) return true; // Right
            
            return false;
        }
    }

    buildProperties(editor) {
        editor.buildPointFields(this.startPoint, "Start Point");
        editor.buildPointFields(this.endpoint, "End Point");
    }
}