import { BaseTool } from "./BaseTool.js";
import { VerticalMeasurementShape } from "../shapes/VerticalMeasurementShape.js";
import { Point } from "../shapes/Point.js";
import { Vec4 } from "../Camera.js";

export class VerticalMeasurementTool extends BaseTool {
    constructor(drawBoard) {
        super(drawBoard);
        this.step = 0;
        this.p1 = null; 
        this.currentMeasurement = null;
    }

    onCanvasClick(x, y) {
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
            
            this.currentMeasurement.p2 = p2;
            
            const val = Math.abs(p2.y - this.p1.y);

            let measurementId = this.drawBoard.constraintSystem.addGeometry({
                type: "VerticalMeasurement",
                data: { 
                    p1Id: this.p1.constraintId, 
                    p2Id: p2.constraintId,
                    value: val
                },
                fixed: false
            });

            this.drawBoard.constraintSystem.addConstraint({
                type: "VerticalMeasurement",
                targets: [this.p1.constraintId, p2.constraintId],
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
                worldPos = { x: camVec.x, y: camVec.y };
            }

            if (!this.currentMeasurement) {
                this.currentMeasurement = new VerticalMeasurementShape(this.drawBoard, this.p1, worldPos);
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
