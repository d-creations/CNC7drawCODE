import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from "../Camera.js";
import { Geometry } from "../math/Geometry.js";

export class LengthMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, point1, point2) {
        super(drawBoard.context, drawBoard.camera);
        this.drawBoard = drawBoard;
        this.p1 = point1;
        this.p2 = point2;
        this.offset = 20; // visual offset distance for the measurement line
        this.type = "LengthMeasurement";
    }

    draw() {
        if (!this.p1 || !this.p2) return;

        const ctx = this.drawBoard.context;
        const camera = this.drawBoard.camera;

        const v1 = new Vec4(this.p1.x, this.p1.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const v2 = new Vec4(this.p2.x, this.p2.y, 0, 1).mulMatrix(camera.getCalcMatrix());

        // Calculate angle and length in screen space
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        const screenLen = Math.sqrt(dx * dx + dy * dy);
        if (screenLen < 1) return;

        const ang = Math.atan2(dy, dx);
        
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;

        // Draw extension lines
        const nx = -Math.sin(ang);
        const ny = Math.cos(ang);
        const ex1 = v1.x + nx * this.offset;
        const ey1 = v1.y + ny * this.offset;
        const ex2 = v2.x + nx * this.offset;
        const ey2 = v2.y + ny * this.offset;

        // extension lines from points to offset
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(ex1, ey1);
        ctx.moveTo(v2.x, v2.y);
        ctx.lineTo(ex2, ey2);
        
        // draw main dimension line
        ctx.moveTo(ex1, ey1);
        ctx.lineTo(ex2, ey2);

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

        ctx.lineTo(a1x, a1y);
        ctx.moveTo(ex1, ey1);
        ctx.lineTo(a2x, a2y);

        ctx.moveTo(ex2, ey2);
        ctx.lineTo(b1x, b1y);
        ctx.moveTo(ex2, ey2);
        ctx.lineTo(b2x, b2y);

        ctx.stroke();

        // compute length in world space
        const w_dx = this.p2.x - this.p1.x;
        const w_dy = this.p2.y - this.p1.y;
        const length = Math.sqrt(w_dx * w_dx + w_dy * w_dy);
        const text = length.toFixed(2);

        const midX = (ex1 + ex2) / 2;
        const midY = (ey1 + ey2) / 2;

        ctx.translate(midX, midY);
        // keep text upright
        let textAng = ang;
        if (textAng > Math.PI / 2 || textAng < -Math.PI / 2) {
            textAng += Math.PI;
        }
        ctx.rotate(textAng);
        
        // We draw text centered, slightly offset from the line
        const charSize = 8;
        const textWidth = text.length * charSize * 1.5;
        this.drawStickText(ctx, text, -textWidth / 2, -charSize - 2, charSize, this.color);

        ctx.restore();
    }

    check(x, y, zoom) {
        if (!this.p1 || !this.p2) return Infinity;

        const camera = this.drawBoard.camera;
        const v1 = new Vec4(this.p1.x, this.p1.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const v2 = new Vec4(this.p2.x, this.p2.y, 0, 1).mulMatrix(camera.getCalcMatrix());

        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        const screenLen = Math.sqrt(dx * dx + dy * dy);
        if (screenLen < 1) return Infinity;

        const ang = Math.atan2(dy, dx);
        const nx = -Math.sin(ang);
        const ny = Math.cos(ang);
        
        // Target dimension line (the offset line in screen space)
        const ex1 = v1.x + nx * this.offset;
        const ey1 = v1.y + ny * this.offset;
        const ex2 = v2.x + nx * this.offset;
        const ey2 = v2.y + ny * this.offset;

        // Line-Point Distance Formula for line (ex1,ey1)->(ex2,ey2) to point (x,y)
        let num = Math.abs((ex2 - ex1) * (ey1 - y) - (ex1 - x) * (ey2 - ey1));
        let d = num / screenLen;

        // We only want to click if we're between the bounds of the line
        let dotProduct = ((x - ex1) * (ex2 - ex1) + (y - ey1) * (ey2 - ey1)) / screenLen;
        if (dotProduct < 0 || dotProduct > screenLen) {
            return Infinity;
        }

        return d;
    }

    buildProperties(editor) {
        let divArea = document.createElement('div');
        divArea.style.marginBottom = "10px";
        divArea.style.padding = "5px";
        divArea.style.border = "1px solid #eee";
        divArea.innerHTML = `<h4 style="margin:0 0 5px 0">Length Measurement (Constraint)</h4>`;

        // --- Visual Offset ---
        let offsetInput = editor.createNumberField("Offset", this.offset, (val) => {
            this.offset = val;
            
            // update constraint system data
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.offset = val;
                    editor.drawBoard.saveState();
                }
            }
            editor.drawBoard.draw();
        });

        // --- Distance Modifier (Move Points) ---
        const w_dx = this.p2.x - this.p1.x;
        const w_dy = this.p2.y - this.p1.y;
        const currentLength = Math.sqrt(w_dx * w_dx + w_dy * w_dy);

        let distanceInput = editor.createNumberField("Length (mm)", currentLength, (val) => {
            // Update constraint system data
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.value = val;
                }

                // Find and update true mathematical constraint
                let found = false;
                for (let [cId, cDef] of editor.drawBoard.constraintSystem.constraints) {
                    if (cDef.geometryId === this.constraintId) {
                        cDef.value = val;
                        found = true;
                        break;
                    } else if (!cDef.geometryId && cDef.type === "LengthMeasurement") {
                        if (cDef.targets.includes(this.p1.constraintId) && cDef.targets.includes(this.p2.constraintId)) {
                            cDef.value = val;
                            cDef.geometryId = this.constraintId;
                            found = true;
                            break;
                        }
                    }
                }

                if (!found) {
                    editor.drawBoard.constraintSystem.addConstraint({
                        type: "LengthMeasurement",
                        targets: [this.p1.constraintId, this.p2.constraintId],
                        value: val,
                        geometryId: this.constraintId
                    });
                }

                // Trigger solver
                editor.drawBoard.constraintSystem.solveLocal(this.p2.constraintId);
            }

            editor.drawBoard.saveState();
            editor.drawBoard.draw();
            editor.render();
        });
        
        divArea.appendChild(distanceInput);
        divArea.appendChild(offsetInput);
        editor.container.appendChild(divArea);
    }
}