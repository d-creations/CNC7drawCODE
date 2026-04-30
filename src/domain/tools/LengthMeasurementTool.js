import { BaseTool } from "./BaseTool.js";
import { LengthMeasurementShape } from "../shapes/LengthMeasurementShape.js";
import { Point } from "../shapes/Point.js";
import { Vec4 } from '../viewController/Camera.js';

export class LengthMeasurementTool extends BaseTool {
    constructor(drawBoard) {
        super(drawBoard);
        this.step = 0;
        this.p1 = null; // Storing actual point object
        this.currentMeasurement = null;
    }

    onCanvasClick(x, y) {
        // Try to snap to point
        let snapped = this.drawBoard.selectStartObject(x, y, ["Point"]);
        let pObj;
        
        if (snapped.exist && snapped.obj && snapped.obj.vec4) {
            pObj = snapped.obj;
        } else {
            let camVec = this.drawBoard.camera.getWorldVec(x, y);
            let ptId = this.drawBoard.constraintSystem.addGeometry({
                type: "Point",
                data: { x: camVec.x, y: camVec.y },
                fixed: false
            });
            pObj = new Point(new Vec4(camVec.x, camVec.y, 0, 1));
            pObj.constraintId = ptId;
            this.drawBoard.drawObjects.push(pObj);
        }

        if (this.step === 0) {
            this.p1 = pObj;
            this.step = 1;
        } else if (this.step === 1) {
            const p2 = pObj;
            
            // finalize measurement
            this.currentMeasurement.p2 = p2;
            
            // Distance
            const w_dx = p2.x - this.p1.x;
            const w_dy = p2.y - this.p1.y;
            const val = Math.sqrt(w_dx * w_dx + w_dy * w_dy);

            // Add to constraint system for storage
            let measurementId = this.drawBoard.constraintSystem.addGeometry({
                type: "LengthMeasurement",
                data: { 
                    p1Id: this.p1.constraintId, 
                    p2Id: p2.constraintId,
                    value: val
                },
                fixed: false
            });

            // Add proper mathematical constraint!
            this.drawBoard.constraintSystem.addConstraint({
                type: "LengthMeasurement",
                targets: [this.p1.constraintId, p2.constraintId],
                value: val,
                geometryId: measurementId // Link it to the measurement visual
            });

            this.currentMeasurement.constraintId = measurementId;
            this.drawBoard.drawObjects.push(this.currentMeasurement);
            
            this.step = 0;
            this.p1 = null;
            this.currentMeasurement = null;
            this.drawBoard.drawTempObjects = [];
            this.drawBoard.needsUpdate = true;
            this.drawBoard.draw();
        }
    }

    onMouseMove(x, y) {
        if (this.step === 1) {
            let snapped = this.drawBoard.selectStartObject(x, y, ["Point"]);
            let worldPos;
            if (snapped.exist && snapped.obj && snapped.obj.vec4) {
                worldPos = snapped.obj;
            } else {
                let camVec = this.drawBoard.camera.getWorldVec(x, y);
                // Temporary point for dragging visual
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