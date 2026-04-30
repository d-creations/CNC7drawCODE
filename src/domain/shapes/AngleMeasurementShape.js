import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from "../Camera.js";
import { Geometry } from "../math/Geometry.js";

export class AngleMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, line1, line2) {
        super();
        this.drawBoard = drawBoard;
        this.l1 = line1;
        this.l2 = line2;
        this.radius = 40; // visuals radius
        this.textAnchor = null;
        this.anchorRadius = 6;
        this.type = "AngleMeasurement";
    }

    getRenderData() {
        if (!this.l1 || !this.l2) return [];
        const intersection = Geometry.lineIntersection(this.l1, this.l2);
        if (!intersection) return [];
        
        let a1 = Math.atan2(this.l1.endpoint.vec4.y - this.l1.startPoint.vec4.y, this.l1.endpoint.vec4.x - this.l1.startPoint.vec4.x);
        let a2 = Math.atan2(this.l2.endpoint.vec4.y - this.l2.startPoint.vec4.y, this.l2.endpoint.vec4.x - this.l2.startPoint.vec4.x);
        
        let angle = Math.abs(a2 - a1);
        if (angle > Math.PI) angle = 2 * Math.PI - angle;
        const deg = (angle * 180 / Math.PI).toFixed(1);
        const textToDraw = deg + ' deg';
        const midAng = (a1 + a2) / 2;

        const defaultAnchorX = intersection.x + Math.cos(midAng) * (this.radius + 30);
        const defaultAnchorY = intersection.y + Math.sin(midAng) * (this.radius + 30);
        const anchorX = this.textAnchor ? this.textAnchor.x : defaultAnchorX;
        const anchorY = this.textAnchor ? this.textAnchor.y : defaultAnchorY;

        const dimInstr = {
            primitive: 'dimension_angle',
            worldIntersection: { x: intersection.x, y: intersection.y },
            radius: this.radius,
            a1: Math.min(a1, a2),
            a2: Math.max(a1, a2),
            midAng: midAng,
            text: textToDraw,
            color: this.color
        };
        if (this.textAnchor) dimInstr.textAnchor = { x: this.textAnchor.x, y: this.textAnchor.y };

        const leaderInstr = {
            primitive: 'line',
            worldStartX: intersection.x + Math.cos(midAng) * this.radius,
            worldStartY: intersection.y + Math.sin(midAng) * this.radius,
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
        divArea.innerHTML = `<h4 style="margin:0 0 5px 0">Angle Measurement (Constraint)</h4>`;

        // --- 2) Radius Field (Visuals) ---
        let radiusInput = editor.createNumberField("Radius", this.radius, (val) => {
            this.radius = val;
            // update constraint system data
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.radius = val;
                    editor.drawBoard.saveState();
                }
            }
            editor.drawBoard.draw();
        });

        // --- 3) Angle Constraining Field (Modify Line 2) ---
        // Calculate current angle using real direction vectors
        let a1 = Math.atan2(this.l1.endpoint.vec4.y - this.l1.startPoint.vec4.y, this.l1.endpoint.vec4.x - this.l1.startPoint.vec4.x);
        let a2 = Math.atan2(this.l2.endpoint.vec4.y - this.l2.startPoint.vec4.y, this.l2.endpoint.vec4.x - this.l2.startPoint.vec4.x);
        
        let diff = a2 - a1;
        // Normalize diff to -PI to PI
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        
        let currentDeg = Math.abs(diff) * 180 / Math.PI;

        let angleConstraintInput = editor.createNumberField("Angle (°)", currentDeg, (val) => {
            let targetRad = val * Math.PI / 180;

            // 1. Find the parent Geometry data
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.value = targetRad;
                }

                // 2. Find the attached Mathematical Constraint
                let found = false;
                for (let [cId, cDef] of editor.drawBoard.constraintSystem.constraints) {
                    if (cDef.geometryId === this.constraintId) {
                        cDef.value = targetRad;
                        found = true;
                        break;
                    } else if (!cDef.geometryId && cDef.type === "AngleMeasurement") {
                        // Legacy match: verify ALL targeting points strictly so we don't steal another angle's math
                        let hasAll = cDef.targets.includes(this.l1.startPoint.constraintId) &&
                                     cDef.targets.includes(this.l1.endpoint.constraintId) &&
                                     cDef.targets.includes(this.l2.startPoint.constraintId) &&
                                     cDef.targets.includes(this.l2.endpoint.constraintId);
                        if (hasAll) {
                            cDef.value = targetRad;
                            cDef.geometryId = this.constraintId;
                            found = true;
                            break;
                        }
                    }
                }

                if (!found) {
                    editor.drawBoard.constraintSystem.addConstraint({
                        type: "AngleMeasurement",
                        targets: [this.l1.startPoint.constraintId, this.l1.endpoint.constraintId, this.l2.startPoint.constraintId, this.l2.endpoint.constraintId],
                        value: targetRad,
                        geometryId: this.constraintId
                    });
                }

                // 3. Trigger the true solver instead of manually dragging coordinates
                editor.drawBoard.constraintSystem.solveLocal(this.l2.endpoint.constraintId);
            }

            editor.drawBoard.saveState();
            editor.drawBoard.draw();
            editor.render(); // Re-render to show updated shapes
        });
        
        divArea.appendChild(radiusInput);
        divArea.appendChild(angleConstraintInput);

        // Text anchor controls
        const intersectionPoint = Geometry.lineIntersection(this.l1, this.l2);
        let defaultAnchorX = 0, defaultAnchorY = 0;
        if (intersectionPoint) {
            defaultAnchorX = intersectionPoint.x + Math.cos(midAng) * (this.radius + 30);
            defaultAnchorY = intersectionPoint.y + Math.sin(midAng) * (this.radius + 30);
        }
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
                        // update ephemeral visual anchor (created during loadState) if present
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
        // Add optional button to convert this text anchor into a solver-aware Point geometry
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