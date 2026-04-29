import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from "../Camera.js";
import { Geometry } from "../math/Geometry.js";

export class LengthMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, point1, point2) {
        super();
        this.drawBoard = drawBoard;
        this.p1 = point1;
        this.p2 = point2;
        this.offset = 20; // visual offset distance for the measurement line
        this.type = "LengthMeasurement";
    }

    getRenderData() {
        if (!this.p1 || !this.p2) return [];

        const w_dx = this.p2.x - this.p1.x;
        const w_dy = this.p2.y - this.p1.y;
        const length = Math.sqrt(w_dx * w_dx + w_dy * w_dy);
        const text = length.toFixed(2);

        return [
            {
                primitive: 'dimension_length',
                worldP1: { x: this.p1.x, y: this.p1.y },
                worldP2: { x: this.p2.x, y: this.p2.y },
                offset: this.offset,
                text: text,
                color: this.color
            }
        ];
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