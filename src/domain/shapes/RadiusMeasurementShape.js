import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from "../Camera.js";

export class RadiusMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, circle) {
        super();
        this.drawBoard = drawBoard;
        this.circle = circle;
        this.angle = Math.PI / 4; // Default angle for measurement line
        this.textAnchor = null;
        this.anchorRadius = 6;
        this.type = "RadiusMeasurement";
    }

    getRenderData() {
        if (!this.circle || !this.circle.centerPoint) return [];
        const cx = this.circle.centerPoint.vec4.x;
        const cy = this.circle.centerPoint.vec4.y;

        const text = 'R' + this.circle.radius.toFixed(2);

        const defaultAnchorX = cx + Math.cos(this.angle) * (this.circle.radius + 30);
        const defaultAnchorY = cy + Math.sin(this.angle) * (this.circle.radius + 30);
        const anchorX = this.textAnchor ? this.textAnchor.x : defaultAnchorX;
        const anchorY = this.textAnchor ? this.textAnchor.y : defaultAnchorY;

        const dimInstr = {
            primitive: 'dimension_radius',
            worldCenter: { x: cx, y: cy },
            worldRadius: this.circle.radius,
            angle: this.angle,
            text: text,
            color: this.color
        };
        if (this.textAnchor) dimInstr.textAnchor = { x: this.textAnchor.x, y: this.textAnchor.y };

        const leaderInstr = {
            primitive: 'line',
            worldStartX: cx + Math.cos(this.angle) * this.circle.radius,
            worldStartY: cy + Math.sin(this.angle) * this.circle.radius,
            worldEndX: anchorX,
            worldEndY: anchorY,
            color: this.color
        };

        const anchorInstr = {
            primitive: 'arc',
            worldX: anchorX,
            worldY: anchorY,
            radius: this.anchorRadius,
            fill: true,
            color: this.color
        };

        return [dimInstr, leaderInstr, anchorInstr];
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

        // Text anchor controls
        const cx = this.circle.centerPoint.vec4.x;
        const cy = this.circle.centerPoint.vec4.y;
        const defaultAnchorX = cx + Math.cos(this.angle) * (this.circle.radius + 30);
        const defaultAnchorY = cy + Math.sin(this.angle) * (this.circle.radius + 30);
        const initialX = this.textAnchor ? this.textAnchor.x : defaultAnchorX;
        const initialY = this.textAnchor ? this.textAnchor.y : defaultAnchorY;

        let anchorXInput = editor.createNumberField("Text X", initialX, (val) => {
                this.textAnchor = this.textAnchor || {};
                this.textAnchor.x = val;
                if (!isFinite(this.textAnchor.y)) this.textAnchor.y = initialY;
            if (this.textAnchorPointId) {
                const pGeo = editor.drawBoard.constraintSystem.geometries.get(this.textAnchorPointId);
                if (pGeo && pGeo.data) pGeo.data.x = Number(val);
                const pObj = editor.drawBoard.drawObjects.find(o => o.constraintId === this.textAnchorPointId);
                if (pObj && pObj.vec4) pObj.vec4.x = Number(val);
                editor.drawBoard.saveState();
            } else {
                const pObj = editor.drawBoard.drawObjects.find(o => o.isTextAnchor && o.parentMeasurementId === this.constraintId);
                if (pObj && pObj.vec4) pObj.vec4.x = Number(val);
                if (this.constraintId) { let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId); if (geo) { geo.data.textAnchor = this.textAnchor; editor.drawBoard.saveState(); } }
            }
            editor.drawBoard.draw();
        });

        let anchorYInput = editor.createNumberField("Text Y", initialY, (val) => {
                this.textAnchor = this.textAnchor || {};
                this.textAnchor.y = val;
                if (!isFinite(this.textAnchor.x)) this.textAnchor.x = initialX;
            if (this.textAnchorPointId) {
                const pGeo = editor.drawBoard.constraintSystem.geometries.get(this.textAnchorPointId);
                if (pGeo && pGeo.data) pGeo.data.y = Number(val);
                const pObj = editor.drawBoard.drawObjects.find(o => o.constraintId === this.textAnchorPointId);
                if (pObj && pObj.vec4) pObj.vec4.y = Number(val);
                editor.drawBoard.saveState();
            } else {
                const pObj = editor.drawBoard.drawObjects.find(o => o.isTextAnchor && o.parentMeasurementId === this.constraintId);
                if (pObj && pObj.vec4) pObj.vec4.y = Number(val);
                if (this.constraintId) { let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId); if (geo) { geo.data.textAnchor = this.textAnchor; editor.drawBoard.saveState(); } }
            }
            editor.drawBoard.draw();
        });

        divArea.appendChild(anchorXInput);
        divArea.appendChild(anchorYInput);
        let anchorBtn = document.createElement('button');
        anchorBtn.textContent = 'Make anchor a geometry';
        anchorBtn.onclick = () => {
            const x = this.textAnchor ? this.textAnchor.x : initialX;
            const y = this.textAnchor ? this.textAnchor.y : initialY;
            editor.drawBoard.createTextAnchorGeometry(this, x, y);
        };
        divArea.appendChild(anchorBtn);
        editor.container.appendChild(divArea);
    }
}
