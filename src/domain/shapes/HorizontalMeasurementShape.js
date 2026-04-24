import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from "../Camera.js";

export class HorizontalMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, point1, point2) {
        super(drawBoard.context, drawBoard.camera);
        this.drawBoard = drawBoard;
        this.p1 = point1;
        this.p2 = point2;
        this.offset = 20; // visual offset distance for the measurement line
        this.type = "HorizontalMeasurement";
    }

    draw() {
        if (!this.p1 || !this.p2) return;

        const ctx = this.drawBoard.context;
        const camera = this.drawBoard.camera;

        const v1 = new Vec4(this.p1.x, this.p1.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const v2 = new Vec4(this.p2.x, this.p2.y, 0, 1).mulMatrix(camera.getCalcMatrix());

        const dx = v2.x - v1.x;
        const screenLen = Math.abs(dx);
        if (screenLen < 1) return;

        const ang = dx >= 0 ? 0 : Math.PI;
        
        // Place dimension line at an offset from average Y
        const baseY = (v1.y + v2.y) / 2;
        const ey = baseY + this.offset;

        const ex1 = v1.x;
        const ex2 = v2.x;

        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;

        // extension lines
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(ex1, ey);
        ctx.moveTo(v2.x, v2.y);
        ctx.lineTo(ex2, ey);
        
        // draw main dimension line
        ctx.moveTo(ex1, ey);
        ctx.lineTo(ex2, ey);

        // draw arrows
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

        ctx.moveTo(ex1, ey);
        ctx.lineTo(a1x, a1y);
        ctx.moveTo(ex1, ey);
        ctx.lineTo(a2x, a2y);

        ctx.moveTo(ex2, ey);
        ctx.lineTo(b1x, b1y);
        ctx.moveTo(ex2, ey);
        ctx.lineTo(b2x, b2y);

        ctx.stroke();

        // compute length in world space
        const w_dx = Math.abs(this.p2.x - this.p1.x);
        const text = w_dx.toFixed(2);

        const midX = (ex1 + ex2) / 2;
        const midY = ey;

        ctx.translate(midX, midY);
        
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
        const screenLen = Math.abs(dx);
        if (screenLen < 1) return Infinity;

        const baseY = (v1.y + v2.y) / 2;
        const ey = baseY + this.offset;
        const ex1 = v1.x;
        const ex2 = v2.x;

        let d = Math.abs(y - ey);

        let minX = Math.min(ex1, ex2);
        let maxX = Math.max(ex1, ex2);
        if (x < minX || x > maxX) {
            return Infinity;
        }

        return d;
    }

    buildProperties(editor) {
        let divArea = document.createElement('div');
        divArea.style.marginBottom = "10px";
        divArea.style.padding = "5px";
        divArea.style.border = "1px solid #eee";
        divArea.innerHTML = `<h4 style="margin:0 0 5px 0">Horizontal Measurement (Constraint)</h4>`;

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

        const currentLength = Math.abs(this.p2.x - this.p1.x);

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
                    } else if (!cDef.geometryId && cDef.type === "HorizontalMeasurement") {
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
                        type: "HorizontalMeasurement",
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
