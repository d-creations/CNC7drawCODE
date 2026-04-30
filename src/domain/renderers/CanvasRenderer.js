import { Vec4 } from "../Camera.js";

import { stickFont } from "../LetterDrawer.js";

export class CanvasRenderer {
    constructor(ctx, camera) {
        this.ctx = ctx;
        this.camera = camera;
    }

    renderShapes(shapes) {
        for (const shape of shapes) {
            if (typeof shape.getRenderData === "function") {
                const displayList = shape.getRenderData();
                this.renderDisplayList(displayList);
            } else {
                // Temporary fallback for shapes not yet migrated
                if (typeof shape.draw === "function") {
                    shape.draw();
                }
            }
        }
    }

    renderDisplayList(displayList) {
        for (const instruction of displayList) {
            if (instruction.primitive === 'line') {
                let startCam = new Vec4(instruction.worldStartX, instruction.worldStartY, 0, 1).mulMatrix(this.camera.getCalcMatrix());
                let endCam = new Vec4(instruction.worldEndX, instruction.worldEndY, 0, 1).mulMatrix(this.camera.getCalcMatrix());
                
                this.ctx.beginPath();
                this.ctx.moveTo(startCam.x, startCam.y);
                this.ctx.lineTo(endCam.x, endCam.y);
                
                if (instruction.color) {
                    this.ctx.strokeStyle = instruction.color;
                }
                if (instruction.lineWidth) {
                    this.ctx.lineWidth = instruction.lineWidth;
                }
                
                this.ctx.stroke();
                
                // reset line width to default 1
                this.ctx.lineWidth = 1;
            } 
            else if (instruction.primitive === 'arc') {
                let centerCam = new Vec4(instruction.worldX, instruction.worldY, 0, 1).mulMatrix(this.camera.getCalcMatrix());
                
                let renderedRadius = 0;
                if (instruction.worldRadius !== undefined) {
                    let cameraScale = this.camera.getCalcMatrix()[0][0];
                    renderedRadius = instruction.worldRadius * cameraScale;
                } else if (instruction.radius !== undefined) {
                    renderedRadius = instruction.radius;
                }
                
                let startAngle = instruction.startAngle !== undefined ? instruction.startAngle : 0;
                let endAngle = instruction.endAngle !== undefined ? instruction.endAngle : 2 * Math.PI;

                this.ctx.beginPath();
                this.ctx.arc(centerCam.x, centerCam.y, renderedRadius, startAngle, endAngle);
                
                if (instruction.color) {
                    this.ctx.fillStyle = instruction.color;
                    this.ctx.strokeStyle = instruction.color;
                }
                
                if (instruction.lineWidth) {
                    this.ctx.lineWidth = instruction.lineWidth;
                }
                
                if (instruction.fill) {
                    this.ctx.fill();
                }
                if (instruction.stroke) {
                    this.ctx.stroke();
                }
                
                // reset line width
                this.ctx.lineWidth = 1;
            }
            else if (instruction.primitive === 'dimension_length') {
                this.renderDimensionLength(instruction);
            }
            else if (instruction.primitive === 'dimension_horizontal') {
                this.renderDimensionHorizontal(instruction);
            }
            else if (instruction.primitive === 'dimension_vertical') {
                this.renderDimensionVertical(instruction);
            }
            else if (instruction.primitive === 'dimension_radius') {
                this.renderDimensionRadius(instruction);
            }
            else if (instruction.primitive === 'dimension_angle') {
                this.renderDimensionAngle(instruction);
            }
        }
    }

    renderDimensionLength(instruction) {
        let v1 = new Vec4(instruction.worldP1.x, instruction.worldP1.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        let v2 = new Vec4(instruction.worldP2.x, instruction.worldP2.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());

        // Calculate angle and length in screen space
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        const screenLen = Math.sqrt(dx * dx + dy * dy);
        if (screenLen < 1) return;

        const ang = Math.atan2(dy, dx);
        
        this.ctx.save();
        this.ctx.strokeStyle = instruction.color || "purple";
        this.ctx.lineWidth = 1;

        // Draw extension lines
        const nx = -Math.sin(ang);
        const ny = Math.cos(ang);
        const ex1 = v1.x + nx * instruction.offset;
        const ey1 = v1.y + ny * instruction.offset;
        const ex2 = v2.x + nx * instruction.offset;
        const ey2 = v2.y + ny * instruction.offset;

        // extension lines from points to offset
        this.ctx.beginPath();
        this.ctx.moveTo(v1.x, v1.y);
        this.ctx.lineTo(ex1, ey1);
        this.ctx.moveTo(v2.x, v2.y);
        this.ctx.lineTo(ex2, ey2);
        
        // draw main dimension line
        this.ctx.moveTo(ex1, ey1);
        this.ctx.lineTo(ex2, ey2);

        // draw arrows
        const arrowSize = 10;
        const arrowAng = Math.PI / 6;
        
        const a1x = ex1 + Math.cos(ang - arrowAng) * arrowSize;
        const a1y = ey1 + Math.sin(ang - arrowAng) * arrowSize;
        const a2x = ex1 + Math.cos(ang + arrowAng) * arrowSize;
        const a2y = ey1 + Math.sin(ang + arrowAng) * arrowSize;

        const b1x = ex2 - Math.cos(ang - arrowAng) * arrowSize;
        const b1y = ey2 - Math.sin(ang - arrowAng) * arrowSize;
        const b2x = ex2 - Math.cos(ang + arrowAng) * arrowSize;
        const b2y = ey2 - Math.sin(ang + arrowAng) * arrowSize;

        this.ctx.moveTo(ex1, ey1);
        this.ctx.lineTo(a1x, a1y);
        this.ctx.moveTo(ex1, ey1);
        this.ctx.lineTo(a2x, a2y);

        this.ctx.moveTo(ex2, ey2);
        this.ctx.lineTo(b1x, b1y);
        this.ctx.moveTo(ex2, ey2);
        this.ctx.lineTo(b2x, b2y);

        this.ctx.stroke();

        let midX = (ex1 + ex2) / 2;
        let midY = (ey1 + ey2) / 2;
        
        if (instruction.textAnchor) {
            let anchorCam = new Vec4(instruction.textAnchor.x, instruction.textAnchor.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
            midX = anchorCam.x;
            midY = anchorCam.y;
            this.ctx.beginPath();
            this.ctx.moveTo((ex1+ex2)/2, (ey1+ey2)/2);
            this.ctx.lineTo(midX, midY);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(midX, midY, 3, 0, 2 * Math.PI);
            this.ctx.fillStyle = "purple";
            this.ctx.fill();
        }

        this.ctx.translate(midX, midY);
        // keep text upright
        let textAng = ang;
        if (textAng > Math.PI / 2 || textAng < -Math.PI / 2) {
            textAng += Math.PI;
        }
        this.ctx.rotate(textAng);

        const charSize = 8;
        const textWidth = instruction.text.length * charSize * 1.5;
        this.drawStickText(instruction.text, -textWidth / 2, -charSize - 2, charSize, instruction.color || "purple");

        this.ctx.restore();
    }
    renderDimensionHorizontal(instruction) {
        let v1 = new Vec4(instruction.worldP1.x, instruction.worldP1.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        let v2 = new Vec4(instruction.worldP2.x, instruction.worldP2.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());

        const dx = v2.x - v1.x;
        const screenLen = Math.abs(dx);
        if (screenLen < 1) return;

        const ang = dx >= 0 ? 0 : Math.PI;
        
        const baseY = (v1.y + v2.y) / 2;
        const ey = baseY + instruction.offset;

        const ex1 = v1.x;
        const ex2 = v2.x;

        this.ctx.save();
        this.ctx.strokeStyle = instruction.color || "purple";
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        this.ctx.moveTo(v1.x, v1.y);
        this.ctx.lineTo(ex1, ey);
        this.ctx.moveTo(v2.x, v2.y);
        this.ctx.lineTo(ex2, ey);
        
        this.ctx.moveTo(ex1, ey);
        this.ctx.lineTo(ex2, ey);

        const arrowSize = 10;
        const arrowAng = Math.PI / 6;
        
        const a1x = ex1 + Math.cos(ang - arrowAng) * arrowSize;
        const a1y = ey + Math.sin(ang - arrowAng) * arrowSize;
        const a2x = ex1 + Math.cos(ang + arrowAng) * arrowSize;
        const a2y = ey + Math.sin(ang + arrowAng) * arrowSize;

        const b1x = ex2 - Math.cos(ang - arrowAng) * arrowSize;
        const b1y = ey - Math.sin(ang - arrowAng) * arrowSize;
        const b2x = ex2 - Math.cos(ang + arrowAng) * arrowSize;
        const b2y = ey - Math.sin(ang + arrowAng) * arrowSize;

        this.ctx.moveTo(ex1, ey);
        this.ctx.lineTo(a1x, a1y);
        this.ctx.moveTo(ex1, ey);
        this.ctx.lineTo(a2x, a2y);

        this.ctx.moveTo(ex2, ey);
        this.ctx.lineTo(b1x, b1y);
        this.ctx.moveTo(ex2, ey);
        this.ctx.lineTo(b2x, b2y);

        this.ctx.stroke();

        let midX = (ex1 + ex2) / 2;
        let midY = ey;
        
        if (instruction.textAnchor) {
            let anchorCam = new Vec4(instruction.textAnchor.x, instruction.textAnchor.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
            midX = anchorCam.x;
            midY = anchorCam.y;
            this.ctx.beginPath();
            this.ctx.moveTo((ex1+ex2)/2, ey);
            this.ctx.lineTo(midX, midY);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(midX, midY, 3, 0, 2 * Math.PI);
            this.ctx.fillStyle = "purple";
            this.ctx.fill();
        }

        this.ctx.translate(midX, midY);
        
        const charSize = 8;
        const textWidth = instruction.text.length * charSize * 1.5;
        this.drawStickText(instruction.text, -textWidth / 2, -charSize - 2, charSize, instruction.color || "purple");

        this.ctx.restore();
    }

    renderDimensionVertical(instruction) {
        let v1 = new Vec4(instruction.worldP1.x, instruction.worldP1.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        let v2 = new Vec4(instruction.worldP2.x, instruction.worldP2.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());

        const dy = v2.y - v1.y;
        const screenLen = Math.abs(dy);
        if (screenLen < 1) return;

        const ang = dy >= 0 ? Math.PI/2 : -Math.PI/2;
        
        const baseX = (v1.x + v2.x) / 2;
        const ex = baseX + instruction.offset;

        const ey1 = v1.y;
        const ey2 = v2.y;

        this.ctx.save();
        this.ctx.strokeStyle = instruction.color || "purple";
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        this.ctx.moveTo(v1.x, v1.y);
        this.ctx.lineTo(ex, ey1);
        this.ctx.moveTo(v2.x, v2.y);
        this.ctx.lineTo(ex, ey2);
        
        this.ctx.moveTo(ex, ey1);
        this.ctx.lineTo(ex, ey2);

        const arrowSize = 10;
        const arrowAng = Math.PI / 6;
        
        const a1x = ex + Math.cos(ang - arrowAng) * arrowSize;
        const a1y = ey1 + Math.sin(ang - arrowAng) * arrowSize;
        const a2x = ex + Math.cos(ang + arrowAng) * arrowSize;
        const a2y = ey1 + Math.sin(ang + arrowAng) * arrowSize;

        const b1x = ex - Math.cos(ang - arrowAng) * arrowSize;
        const b1y = ey2 - Math.sin(ang - arrowAng) * arrowSize;
        const b2x = ex - Math.cos(ang + arrowAng) * arrowSize;
        const b2y = ey2 - Math.sin(ang + arrowAng) * arrowSize;

        this.ctx.moveTo(ex, ey1);
        this.ctx.lineTo(a1x, a1y);
        this.ctx.moveTo(ex, ey1);
        this.ctx.lineTo(a2x, a2y);

        this.ctx.moveTo(ex, ey2);
        this.ctx.lineTo(b1x, b1y);
        this.ctx.moveTo(ex, ey2);
        this.ctx.lineTo(b2x, b2y);

        this.ctx.stroke();

        let midX = ex;
        let midY = (ey1 + ey2) / 2;
        
        if (instruction.textAnchor) {
            let anchorCam = new Vec4(instruction.textAnchor.x, instruction.textAnchor.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
            midX = anchorCam.x;
            midY = anchorCam.y;
            this.ctx.beginPath();
            this.ctx.moveTo(ex, (ey1+ey2)/2);
            this.ctx.lineTo(midX, midY);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(midX, midY, 3, 0, 2 * Math.PI);
            this.ctx.fillStyle = "purple";
            this.ctx.fill();
        }

        this.ctx.translate(midX, midY);
        this.ctx.rotate(-Math.PI / 2);
        
        const charSize = 8;
        const textWidth = instruction.text.length * charSize * 1.5;
        this.drawStickText(instruction.text, -textWidth / 2, -charSize - 2, charSize, instruction.color || "purple");

        this.ctx.restore();
    }

    renderDimensionRadius(instruction) {
        const scale = this.camera.getCalcMatrix()[0][0];
        let centerCam = new Vec4(instruction.worldCenter.x, instruction.worldCenter.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        const scaledRadius = instruction.worldRadius * scale;

        this.ctx.save();
        this.ctx.strokeStyle = instruction.color || "purple";
        this.ctx.lineWidth = 1;

        let screenAng = -instruction.angle; 
        let lx, ly;

        if (instruction.textAnchor) {
            let anchorCam = new Vec4(instruction.textAnchor.x, instruction.textAnchor.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
            lx = anchorCam.x;
            ly = anchorCam.y;
            let dx = lx - centerCam.x;
            let dy = ly - centerCam.y;
            screenAng = Math.atan2(dy, dx);
        } else {
            const extLen = 20;
            lx = centerCam.x + Math.cos(screenAng) * (scaledRadius + extLen);
            ly = centerCam.y + Math.sin(screenAng) * (scaledRadius + extLen);
        }

        const sx = centerCam.x + Math.cos(screenAng) * scaledRadius;
        const sy = centerCam.y + Math.sin(screenAng) * scaledRadius;

        this.ctx.beginPath();
        this.ctx.moveTo(centerCam.x, centerCam.y);
        this.ctx.lineTo(lx, ly);

        const arrowSize = 10;
        const arrowAng = Math.PI / 6;
        
        const a1x = sx - Math.cos(screenAng - arrowAng) * arrowSize;
        const a1y = sy - Math.sin(screenAng - arrowAng) * arrowSize;
        const a2x = sx - Math.cos(screenAng + arrowAng) * arrowSize;
        const a2y = sy - Math.sin(screenAng + arrowAng) * arrowSize;

        this.ctx.moveTo(a1x, a1y);
        this.ctx.lineTo(sx, sy);
        this.ctx.lineTo(a2x, a2y);

        this.ctx.stroke();

        this.ctx.translate(lx, ly);
        
        if (instruction.textAnchor) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 3, 0, 2 * Math.PI);
            this.ctx.fillStyle = "purple";
            this.ctx.fill();
        }

        const charSize = 8;
        this.drawStickText(instruction.text, 5, -charSize/2, charSize, instruction.color || "purple");

        this.ctx.restore();
    }

    renderDimensionAngle(instruction) {
        let interScr = new Vec4(instruction.worldIntersection.x, instruction.worldIntersection.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());

        this.ctx.save();
        this.ctx.strokeStyle = instruction.color || "purple";
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        this.ctx.arc(interScr.x, interScr.y, instruction.radius, instruction.a1, instruction.a2);
        this.ctx.stroke();

        let textX = interScr.x + Math.cos(instruction.midAng) * (instruction.radius + 15);
        let textY = interScr.y + Math.sin(instruction.midAng) * (instruction.radius + 15);

        if (instruction.textAnchor) {
            let anchorCam = new Vec4(instruction.textAnchor.x, instruction.textAnchor.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
            let lineStartX = textX;
            let lineStartY = textY;
            textX = anchorCam.x;
            textY = anchorCam.y;
            this.ctx.beginPath();
            this.ctx.moveTo(lineStartX, lineStartY);
            this.ctx.lineTo(textX, textY);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(textX, textY, 3, 0, 2 * Math.PI);
            this.ctx.fillStyle = "purple";
            this.ctx.fill();
        }

        const charSize = 8;
        const textWidth = instruction.text.length * charSize * 1.5;
        this.drawStickText(instruction.text, textX - textWidth/2, textY, charSize, instruction.color || "purple");

        this.ctx.restore();
    }


    drawStickText(text, startX, startY, size, color) {
        let currentX = startX;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ') {
                currentX += size * 1.5;
                continue;
            }
            
            const strokes = stickFont[char];
            if (strokes) {
                this.ctx.beginPath();
                for (let stroke of strokes) {
                    const [p1, p2] = stroke;
                    
                    this.ctx.moveTo(currentX + p1[0] * size, startY + p1[1] * size);
                    this.ctx.lineTo(currentX + p2[0] * size, startY + p2[1] * size);
                }
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
            currentX += size * 1.5;
        }
    }
}