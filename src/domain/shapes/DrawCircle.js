import { BaseShape } from "./BaseShape.js";
import { Point } from "./Point.js";

export class DrawCircle extends BaseShape {
    centerPoint;
    radius;

    constructor(centerPoint, radius) {
        super();
        this.centerPoint = centerPoint;
        this.radius = radius;
    }

    getRenderData() {
        if (!this.centerPoint || !this.centerPoint.vec4) {
            // Defensive: skip rendering if centerPoint is not valid
            return [];
        }
        return [
            {
                primitive: 'arc',
                worldX: this.centerPoint.vec4.x,
                worldY: this.centerPoint.vec4.y,
                worldRadius: this.radius,
                color: this.color,
                stroke: true
            }
        ];
    }



    buildProperties(editor) {
        editor.buildPointFields(this.centerPoint, "Center Point");

        let radiusArea = document.createElement('div');
        radiusArea.style.marginBottom = "10px";
        radiusArea.style.padding = "5px";
        radiusArea.style.border = "1px solid #eee";
        radiusArea.innerHTML = `<h4 style="margin:0 0 5px 0">Dimensions</h4>`;
        
        let rInput = editor.createNumberField("Radius", this.radius, (val) => {
            this.radius = val;
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.r = val;
                }
                
                // Keep connected algebraic constraints in sync to avoid solver locking!
                for (let [cId, cDef] of editor.drawBoard.constraintSystem.constraints) {
                    if (cDef.type === "RadiusMeasurement" && cDef.targets.includes(this.constraintId)) {
                        cDef.value = val;
                        let mGeo = editor.drawBoard.constraintSystem.geometries.get(cDef.geometryId);
                        if (mGeo) mGeo.data.value = val;
                    }
                }
                
                editor.drawBoard.saveState();
                editor.drawBoard.constraintSystem.solveLocal(this.constraintId);
            }
            editor.drawBoard.draw();
            editor.render();
        });
        
        let dInput = editor.createNumberField("Diameter", this.radius * 2, (val) => {
            this.radius = val / 2.0;
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.r = this.radius;
                }
                
                // Keep connected algebraic constraints in sync to avoid solver locking!
                for (let [cId, cDef] of editor.drawBoard.constraintSystem.constraints) {
                    if (cDef.type === "RadiusMeasurement" && cDef.targets.includes(this.constraintId)) {
                        cDef.value = this.radius;
                        let mGeo = editor.drawBoard.constraintSystem.geometries.get(cDef.geometryId);
                        if (mGeo) mGeo.data.value = this.radius;
                    }
                }
                
                editor.drawBoard.saveState();
                editor.drawBoard.constraintSystem.solveLocal(this.constraintId);
            }
            editor.drawBoard.draw();
            editor.render();
        });

        radiusArea.appendChild(rInput);
        radiusArea.appendChild(dInput);
        editor.container.appendChild(radiusArea);
    }
}