import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from '../viewController/Camera.js';

export class HorizontalMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, point1, point2) {
        super();
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
            textAnchor: this.textAnchor,
            text: w_dx.toFixed(2),
            color: this.color
        }];
    }

    moveAnchor(newX, newY) {
        super.moveAnchor(newX, newY);
        if (this.p1 && this.p2) {
            const baseY = (this.p1.y + this.p2.y) / 2;
            this.offset = newY - baseY;
        }
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

                // Trigger solver
                editor.drawBoard.constraintSystem.solveLocal(this.p2.constraintId);
            }

            editor.drawBoard.saveState();
            editor.drawBoard.draw();
            editor.render();
        });
        
        // append inputs and container (was missing)
        let alignBtn = document.createElement('button');
        alignBtn.innerText = "Align Perfectly Vertical (Length = 0)";
        alignBtn.style.marginTop = "5px";
        alignBtn.style.width = "100%";
        alignBtn.onclick = () => {
             distanceInput.querySelector('input').value = 0;
             distanceInput.querySelector('input').dispatchEvent(new Event('change'));
        };

        divArea.appendChild(distanceInput);
        divArea.appendChild(offsetInput);
        divArea.appendChild(alignBtn);
        editor.container.appendChild(divArea);
    }
}
