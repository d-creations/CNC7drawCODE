import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from "../Camera.js";

export class RadiusMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, circle) {
        super();
        this.drawBoard = drawBoard;
        this.circle = circle;
        this.angle = Math.PI / 4; // Default angle for measurement line
        this.type = "RadiusMeasurement";
    }

    getRenderData() {
        if (!this.circle || !this.circle.centerPoint) return [];
        return [{
            primitive: 'dimension_radius',
            worldCenter: { x: this.circle.centerPoint.vec4.x, y: this.circle.centerPoint.vec4.y },
            worldRadius: this.circle.radius,
            angle: this.angle,
            textAnchor: this.textAnchor,
            text: 'R' + this.circle.radius.toFixed(2),
            color: this.color
        }];
    }


    buildProperties(editor) {
        let divArea = document.createElement('div');
        divArea.style.marginBottom = "10px";
        divArea.style.padding = "5px";
        divArea.style.border = "1px solid #eee";
        divArea.innerHTML = `<h4 style="margin:0 0 5px 0">Radius Measurement (Constraint)</h4>`;

        let angleInput = editor.createNumberField("Angle", this.angle * 180 / Math.PI, (val) => {
            this.angle = val * Math.PI / 180;
            
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.angle = this.angle;
                    editor.drawBoard.saveState();
                }
            }
            editor.drawBoard.draw();
        });

        let radiusInput = editor.createNumberField("Radius (mm)", this.circle.radius, (val) => {
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.value = val;
                }

                let found = false;
                // Update ALL matching constraints so they don't fight
                for (let [cId, cDef] of editor.drawBoard.constraintSystem.constraints) {
                    if (cDef.geometryId === this.constraintId || (cDef.type === "RadiusMeasurement" && cDef.targets.includes(this.circle.constraintId))) {
                        cDef.value = val;
                        cDef.geometryId = this.constraintId;
                        found = true;
                        // Don't break, update all duplicates if they exist to fix the broken state
                    }
                }

                if (!found) {
                    editor.drawBoard.constraintSystem.addConstraint({
                        type: "RadiusMeasurement",
                        targets: [this.circle.constraintId],
                        value: val,
                        geometryId: this.constraintId
                    });
                }
                
                editor.drawBoard.constraintSystem.solveLocal(this.circle.constraintId);
            } else {
                this.circle.radius = val; 
            }

            this.circle.radius = val;
            
            editor.drawBoard.saveState();
            editor.drawBoard.draw();
            editor.render();
        });

        divArea.appendChild(angleInput);
        divArea.appendChild(radiusInput);
        editor.container.appendChild(divArea);
    }
}
