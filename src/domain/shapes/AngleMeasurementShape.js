import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from "../Camera.js";
import { Geometry } from "../math/Geometry.js";

export class AngleMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, line1, line2) {
        super(drawBoard.context, drawBoard.camera);
        this.drawBoard = drawBoard;
        this.l1 = line1;
        this.l2 = line2;
        this.radius = 40; // visuals radius
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

        return [{
            primitive: 'dimension_angle',
            worldIntersection: { x: intersection.x, y: intersection.y },
            radius: this.radius,
            a1: Math.min(a1, a2),
            a2: Math.max(a1, a2),
            midAng: midAng,
            text: textToDraw,
            color: this.color
        }];
    }

    check(x, y) {
        if (!this.l1 || !this.l2) return Infinity;

        const intersection = Geometry.lineIntersection(this.l1, this.l2);
        if (!intersection) return Infinity; // Parallel
        
        const interScr = new Vec4(intersection.x, intersection.y, 0, 1).mulMatrix(this.drawBoard.camera.getCalcMatrix());
        
        // distance from intersection center to mouse
        const distToCenter = Math.sqrt((x - interScr.x)**2 + (y - interScr.y)**2);
        
        // Is mouse close to the arc?
        const band = Math.abs(distToCenter - this.radius);
        
        // Simple angle bounding:
        let a1 = Math.atan2(this.l1.endpoint.vec4.y - this.l1.startPoint.vec4.y, this.l1.endpoint.vec4.x - this.l1.startPoint.vec4.x);
        let a2 = Math.atan2(this.l2.endpoint.vec4.y - this.l2.startPoint.vec4.y, this.l2.endpoint.vec4.x - this.l2.startPoint.vec4.x);
        
        let targetAng = Math.atan2(y - interScr.y, x - interScr.x);
        // Norm target to [min, max] logic used in draw()
        let minA = Math.min(a1, a2);
        let maxA = Math.max(a1, a2);
        
        // Normalize target angle to be compared
        // Since Math.atan2 returns -PI to PI
        if (targetAng < minA) targetAng += 2 * Math.PI;
        if (targetAng > maxA + 2 * Math.PI) targetAng -= 2 * Math.PI;

        if (targetAng >= minA && targetAng <= maxA) {
            return band;
        }

        return Infinity;
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
        editor.container.appendChild(divArea);
    }
}