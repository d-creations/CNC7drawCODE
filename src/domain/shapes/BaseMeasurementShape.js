import { BaseShape } from "./BaseShape.js";
import { stickFont } from "../LetterDrawer.js";
import { Vec4 } from "../Camera.js";

export class BaseMeasurementShape extends BaseShape {
    constructor(ctx, camera) {
        super(ctx, camera);
        this.color = "purple"; // default measurement color
        this.defaultColor = "purple";
        this.isMeasurement = true; // flag to differentiate from geometry
    }

    drawStickText(context, text, startX, startY, size, color) {
        let currentX = startX;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ') {
                currentX += size * 1.5;
                continue;
            }
            
            const strokes = stickFont[char];
            if (strokes) {
                context.beginPath();
                for (let stroke of strokes) {
                    const [p1, p2] = stroke;
                    
                    context.moveTo(currentX + p1[0] * size, startY + p1[1] * size);
                    context.lineTo(currentX + p2[0] * size, startY + p2[1] * size);
                }
                context.strokeStyle = color;
                context.lineWidth = 1;
                context.stroke();
            }
            currentX += size * 1.5;
        }
    }

    // to be overridden
    check(x, y, zoom) {
        return { isHit: false, distance: Infinity };
    }
}
