import { BaseShape } from "./BaseShape.js";
import { Point } from "./Point.js";

export class DrawCircle extends BaseShape {
    centerPoint;
    radius;

    constructor(ctx, camera, centerPoint, radius) {
        super(ctx, camera);
        this.centerPoint = centerPoint;
        this.radius = radius;
    }

    draw() {
        let centerCam = this.centerPoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        let cameraScale = this.camera.getCalcMatrix()[0][0];
        let scaledRadius = this.radius * cameraScale;

        this.ctx.beginPath();
        this.ctx.arc(centerCam.x, centerCam.y, scaledRadius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();
    }

    check(x, y) {
        let centerCam = this.centerPoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        let cameraScale = this.camera.getCalcMatrix()[0][0];
        let scaledRadius = this.radius * cameraScale;

        let distToTarget = Math.sqrt(Math.pow(x - centerCam.x, 2) + Math.pow(y - centerCam.y, 2));
        return Math.abs(distToTarget - scaledRadius);
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