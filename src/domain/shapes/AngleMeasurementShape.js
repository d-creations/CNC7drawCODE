import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from '../viewController/Camera.js';
import { Geometry } from "../math/Geometry.js";

export class AngleMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, line1, line2) {
        super();
        this.drawBoard = drawBoard;
        this.l1 = line1;
        this.l2 = line2;
        this.radius = 40; // visuals radius
        this.type = "AngleMeasurement";
    }

    static normalizeAngle(angle) {
        while (angle < 0) angle += 2 * Math.PI;
        while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
        return angle;
    }

    static shortestArc(startAngle, endAngle) {
        const start = AngleMeasurementShape.normalizeAngle(startAngle);
        const end = AngleMeasurementShape.normalizeAngle(endAngle);
        const ccw = AngleMeasurementShape.normalizeAngle(end - start);

        if (ccw <= Math.PI) {
            return {
                a1: start,
                a2: start + ccw,
                angle: ccw,
                midAng: start + ccw / 2
            };
        }

        const cw = 2 * Math.PI - ccw;
        return {
            a1: end,
            a2: end + cw,
            angle: cw,
            midAng: end + cw / 2
        };
    }

    static getRayAngle(line, intersection) {
        const candidates = [line.startPoint?.vec4, line.endpoint?.vec4].filter(Boolean);
        if (candidates.length === 0) return null;

        let rayPoint = candidates[0];
        let maxDistance = -Infinity;
        for (const point of candidates) {
            const dx = point.x - intersection.x;
            const dy = point.y - intersection.y;
            const distance = dx * dx + dy * dy;
            if (distance > maxDistance) {
                maxDistance = distance;
                rayPoint = point;
            }
        }

        return Math.atan2(rayPoint.y - intersection.y, rayPoint.x - intersection.x);
    }

    static describeAngle(line1, line2) {
        const intersection = Geometry.lineIntersection(line1, line2);
        if (!intersection) return null;

        const a1 = AngleMeasurementShape.getRayAngle(line1, intersection);
        const a2 = AngleMeasurementShape.getRayAngle(line2, intersection);
        if (a1 === null || a2 === null) return null;

        return {
            intersection,
            ...AngleMeasurementShape.shortestArc(a1, a2)
        };
    }

    getRenderData() {
        if (!this.l1 || !this.l2) return [];
        const angleData = AngleMeasurementShape.describeAngle(this.l1, this.l2);
        if (!angleData) return [];

        const deg = (angleData.angle * 180 / Math.PI).toFixed(1);
        const textToDraw = deg + ' deg';

        return [{
            primitive: 'dimension_angle',
            worldIntersection: { x: angleData.intersection.x, y: angleData.intersection.y },
            radius: this.radius,
            a1: angleData.a1,
            a2: angleData.a2,
            midAng: angleData.midAng,
            textAnchor: this.textAnchor,
            text: textToDraw,
            color: this.color
        }];
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
        const angleData = AngleMeasurementShape.describeAngle(this.l1, this.l2);
        let currentDeg = angleData ? angleData.angle * 180 / Math.PI : 0;

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
        editor.container.appendChild(divArea);
    }
}