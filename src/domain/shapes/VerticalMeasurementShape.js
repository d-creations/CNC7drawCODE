import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from "../Camera.js";

export class VerticalMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, point1, point2) {
        super();
        this.drawBoard = drawBoard;
        this.p1 = point1;
        this.p2 = point2;
        this.offset = 20; // visual offset distance for the measurement line
        this.type = "VerticalMeasurement";
    }

    getRenderData() {
        if (!this.p1 || !this.p2) return [];
        const w_dy = Math.abs(this.p2.y - this.p1.y);
        return [{
            primitive: 'dimension_vertical',
            worldP1: { x: this.p1.x, y: this.p1.y },
            worldP2: { x: this.p2.x, y: this.p2.y },
            offset: this.offset,
            textAnchor: this.textAnchor,
            text: w_dy.toFixed(2),
            color: this.color
        }];
    }

    moveAnchor(newX, newY) {
        super.moveAnchor(newX, newY);
        if (this.p1 && this.p2) {
            const baseX = (this.p1.x + this.p2.x) / 2;
            this.offset = newX - baseX;
        }
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
        
        // append inputs and container (was missing)
        divArea.appendChild(distanceInput);
        divArea.appendChild(offsetInput);
        editor.container.appendChild(divArea);
    }
}
