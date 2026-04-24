import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from "../Camera.js";

export class VerticalMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, point1, point2) {
        super(drawBoard.context, drawBoard.camera);
        this.drawBoard = drawBoard;
        this.p1 = point1;
        this.p2 = point2;
        this.offset = 20; // visual offset distance for the measurement line
        this.type = "VerticalMeasurement";
    }

    draw() {
        if (!this.p1 || !this.p2) return;

        const ctx = this.drawBoard.context;
        const camera = this.drawBoard.camera;

        const v1 = new Vec4(this.p1.x, this.p1.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const v2 = new Vec4(this.p2.x, this.p2.y, 0, 1).mulMatrix(camera.getCalcMatrix());

        const dy = v2.y - v1.y;
        const screenLen = Math.abs(dy);
        if (screenLen < 1) return;

        const ang = dy >= 0 ? Math.PI/2 : -Math.PI/2;
        
        // Place dimension line at an offset from average X
        const baseX = (v1.x + v2.x) / 2;
        const ex = baseX + this.offset;

        const ey1 = v1.y;
        const ey2 = v2.y;

        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;

        // extension lines
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(ex, ey1);
        ctx.moveTo(v2.x, v2.y);
        ctx.lineTo(ex, ey2);
        
        // draw main dimension line
        ctx.moveTo(ex, ey1);
        ctx.lineTo(ex, ey2);

        // draw arrows
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

        ctx.moveTo(ex, ey1);
        ctx.lineTo(a1x, a1y);
        ctx.moveTo(ex, ey1);
        ctx.lineTo(a2x, a2y);

        ctx.moveTo(ex, ey2);
        ctx.lineTo(b1x, b1y);
        ctx.moveTo(ex, ey2);
        ctx.lineTo(b2x, b2y);

        ctx.stroke();

        // compute length in world space
        const w_dy = Math.abs(this.p2.y - this.p1.y);
        const text = w_dy.toFixed(2);

        const midX = ex;
        const midY = (ey1 + ey2) / 2;

        ctx.translate(midX, midY);
        ctx.rotate(-Math.PI / 2);
        
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

        const dy = v2.y - v1.y;
        const screenLen = Math.abs(dy);
        if (screenLen < 1) return Infinity;

        const baseX = (v1.x + v2.x) / 2;
        const ex = baseX + this.offset;
        const ey1 = v1.y;
        const ey2 = v2.y;

        let d = Math.abs(x - ex);

        let minY = Math.min(ey1, ey2);
        let maxY = Math.max(ey1, ey2);
        if (y < minY || y > maxY) {
            return Infinity;
        }

        return d;
    }

    buildProperties(editor) {
        let divArea = document.createElement('div');
        divArea.style.marginBottom = "10px";
        divArea.style.padding = "5px";
        divArea.style.border = "1px solid #eee";
        divArea.innerHTML = `<h4 style="margin:0 0 5px 0">Vertical Measurement (Constraint)</h4>`;

        let offsetInput = editor.createNumberField("Offset", this.offset, (val) => {
            this.offset = val;
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.offset = val;
                    editor.drawBoard.saveState();
                }
            }
            editor.drawBoard.draw();
        });

        const currentLength = Math.abs(this.p2.y - this.p1.y);

        let distanceInput = editor.createNumberField("Length (mm)", currentLength, (val) => {
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) geo.data.value = val;

                let found = false;
                for (let [cId, cDef] of editor.drawBoard.constraintSystem.constraints) {
                    if (cDef.geometryId === this.constraintId) {
                        cDef.value = val;
                        found = true;
                        break;
                    } else if (!cDef.geometryId && cDef.type === "VerticalMeasurement") {
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
                        type: "VerticalMeasurement",
                        targets: [this.p1.constraintId, this.p2.constraintId],
                        value: val,
                        geometryId: this.constraintId
                    });
                }
            }
            editor.drawBoard.draw();
        });
    }
}
