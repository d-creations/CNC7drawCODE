import { BaseTool } from "./BaseTool.js";
import { LengthMeasurementShape } from "../shapes/LengthMeasurementShape.js";
import { isObjectType } from '../core/ObjectType.js';

export class LengthMeasurementTool extends BaseTool {
    constructor(drawBoard) {
        super(drawBoard);
        this.step = 0;
        this.p1 = null; // Storing actual point object
        this.currentMeasurement = null;
    }

    resolveMeasurementTarget(x, y) {
        const snapped = this.drawBoard.selectStartObject(x, y, ["Point", "DrawLine", "DrawArc"]);

        if (!snapped.exist || !snapped.obj) {
            return { type: "none" };
        }

        if (isObjectType(snapped.obj, "Point") && snapped.obj.vec4) {
            return { type: "point", point: snapped.obj };
        }

        if (isObjectType(snapped.obj, "DrawLine", "DrawArc")) {
            const startPoint = snapped.obj.startPoint;
            const endPoint = snapped.obj.endpoint;
            if (startPoint?.constraintId && endPoint?.constraintId) {
                return { type: "shape", startPoint, endPoint };
            }
        }

        return { type: "unsupported" };
    }

    finalizeMeasurement(p1, p2) {
        if (!this.currentMeasurement) {
            this.currentMeasurement = new LengthMeasurementShape(this.drawBoard, p1, p2);
        }

        this.currentMeasurement.p1 = p1;
        this.currentMeasurement.p2 = p2;

        const w_dx = p2.x - p1.x;
        const w_dy = p2.y - p1.y;
        const val = Math.sqrt(w_dx * w_dx + w_dy * w_dy);

        let measurementId = this.drawBoard.constraintSystem.addGeometry({
            type: "LengthMeasurement",
            data: {
                p1Id: p1.constraintId,
                p2Id: p2.constraintId,
                value: val
            },
            fixed: false
        });

        this.drawBoard.constraintSystem.addConstraint({
            type: "LengthMeasurement",
            targets: [p1.constraintId, p2.constraintId],
            value: val,
            geometryId: measurementId
        });

        this.currentMeasurement.constraintId = measurementId;
        this.drawBoard.drawObjects.push(this.currentMeasurement);

        this.step = 0;
        this.p1 = null;
        this.currentMeasurement = null;
        this.drawBoard.drawTempObjects = [];
        this.drawBoard.needsUpdate = true;
        this.drawBoard.saveState();
        this.drawBoard.draw();
    }

    onCanvasClick(x, y) {
        const target = this.resolveMeasurementTarget(x, y);

        if (this.step === 0 && target.type === "shape") {
            this.finalizeMeasurement(target.startPoint, target.endPoint);
            return;
        }

        if (target.type !== "point") return;

        let pObj = target.point;

        if (this.step === 0) {
            this.p1 = pObj;
            this.step = 1;
        } else if (this.step === 1) {
            this.finalizeMeasurement(this.p1, pObj);
        }
    }

    onMouseMove(x, y) {
        if (this.step === 1) {
            const target = this.resolveMeasurementTarget(x, y);
            let worldPos;
            if (target.type === "point") {
                worldPos = target.point;
            } else if (target.type === "shape") {
                worldPos = target.endPoint;
            } else {
                let camVec = this.drawBoard.camera.getWorldVec(x, y);
                worldPos = { x: camVec.x, y: camVec.y };
            }

            if (!this.currentMeasurement) {
                this.currentMeasurement = new LengthMeasurementShape(this.drawBoard, this.p1, worldPos);
                this.drawBoard.drawTempObjects = [this.currentMeasurement];
            } else {
                this.currentMeasurement.p2 = worldPos;
            }
            this.drawBoard.needsUpdate = true;
        }
    }

    cancel() {
        this.step = 0;
        this.p1 = null;
        this.currentMeasurement = null;
        this.drawBoard.drawTempObjects = [];
        this.drawBoard.needsUpdate = true;
    }
}