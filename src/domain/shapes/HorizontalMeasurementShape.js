import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from "../Camera.js";

export class HorizontalMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, point1, point2) {
        super();
        this.drawBoard = drawBoard;
        this.p1 = point1;
        this.p2 = point2;
        this.offset = 20; // visual offset distance for the measurement line
        this.textAnchor = null;
        this.anchorRadius = 6;
        this.type = "HorizontalMeasurement";
    }

    getRenderData() {
        if (!this.p1 || !this.p2) return [];
        const w_dx = Math.abs(this.p2.x - this.p1.x);
        const midX = (this.p1.x + this.p2.x) / 2;
        const baseY = (this.p1.y + this.p2.y) / 2;
        const ey = baseY + this.offset;

        const defaultAnchorX = midX;
        const defaultAnchorY = ey + 10;
        const anchorX = this.textAnchor ? this.textAnchor.x : defaultAnchorX;
        const anchorY = this.textAnchor ? this.textAnchor.y : defaultAnchorY;

        const dimInstr = {
            primitive: 'dimension_horizontal',
            worldP1: { x: this.p1.x, y: this.p1.y },
            worldP2: { x: this.p2.x, y: this.p2.y },
            offset: this.offset,
            text: w_dx.toFixed(2),
            color: this.color
        };
        if (this.textAnchor) dimInstr.textAnchor = { x: this.textAnchor.x, y: this.textAnchor.y };

        const leaderInstr = {
            primitive: 'line',
            worldStartX: midX,
            worldStartY: ey,
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
        
        // append inputs and container (was missing)
        divArea.appendChild(distanceInput);
        divArea.appendChild(offsetInput);

        // Text anchor controls
        const midX = (this.p1.x + this.p2.x) / 2;
        const baseY = (this.p1.y + this.p2.y) / 2;
        const ey = baseY + this.offset;
        const initialX = this.textAnchor ? this.textAnchor.x : midX;
        const initialY = this.textAnchor ? this.textAnchor.y : ey + 10;

        this.appendAnchorFields(divArea, editor, initialX, initialY,
            (val) => {
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
            },
            (val) => {
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
            }
        );
        editor.container.appendChild(divArea);
    }
}
