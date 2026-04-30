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
        this.textAnchor = null; // {x,y} world coords for text position (optional)
        this.anchorRadius = 6;
        this.type = "LengthMeasurement";
    }

    getRenderData() {
        if (!this.p1 || !this.p2) return [];

        const w_dx = this.p2.x - this.p1.x;
        const w_dy = this.p2.y - this.p1.y;
        const length = Math.sqrt(w_dx * w_dx + w_dy * w_dy);
        const text = length.toFixed(2);

        // Compute default anchor if not set
        const midX = (this.p1.x + this.p2.x) / 2;
        const midY = (this.p1.y + this.p2.y) / 2;
        let dx = this.p2.x - this.p1.x;
        let dy = this.p2.y - this.p1.y;
        let segLen = Math.sqrt(dx * dx + dy * dy);
        if (segLen === 0) segLen = 1;
        const nx = -dy / segLen; // normal
        const ny = dx / segLen;

        const defaultAnchorX = midX + nx * (this.offset + 10);
        const defaultAnchorY = midY + ny * (this.offset + 10);

        const anchorX = this.textAnchor ? this.textAnchor.x : defaultAnchorX;
        const anchorY = this.textAnchor ? this.textAnchor.y : defaultAnchorY;

        const dimensionInstr = {
            primitive: 'dimension_length',
            worldP1: { x: this.p1.x, y: this.p1.y },
            worldP2: { x: this.p2.x, y: this.p2.y },
            offset: this.offset,
            text: text,
            color: this.color
        };
        if (this.textAnchor) dimensionInstr.textAnchor = { x: this.textAnchor.x, y: this.textAnchor.y };

        const leaderInstr = {
            primitive: 'line',
            worldStartX: midX,
            worldStartY: midY,
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

        return [dimensionInstr, leaderInstr, anchorInstr];
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
        // --- Text anchor controls ---
        const midX = (this.p1.x + this.p2.x) / 2;
        const midY = (this.p1.y + this.p2.y) / 2;
        let dx = this.p2.x - this.p1.x;
        let dy = this.p2.y - this.p1.y;
        let segLen = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / segLen;
        const ny = dx / segLen;
        const defaultAnchorX = midX + nx * (this.offset + 10);
        const defaultAnchorY = midY + ny * (this.offset + 10);

        const initialX = this.textAnchor ? this.textAnchor.x : defaultAnchorX;
        const initialY = this.textAnchor ? this.textAnchor.y : defaultAnchorY;

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