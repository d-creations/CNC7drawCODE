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

    getRenderData() {
        if (!this.p1 || !this.p2) return [];
        const w_dx = Math.abs(this.p2.x - this.p1.x);
        return [{
            primitive: 'dimension_horizontal',
            worldP1: { x: this.p1.x, y: this.p1.y },
            worldP2: { x: this.p2.x, y: this.p2.y },
            offset: this.offset,
            text: w_dx.toFixed(2),
            color: this.color
        }];
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
