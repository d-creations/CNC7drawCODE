import { BaseTool } from "./BaseTool.js";
import { AngleMeasurementShape } from "../shapes/AngleMeasurementShape.js";

export class AngleMeasurementTool extends BaseTool {
    constructor(drawBoard) {
        super(drawBoard);
        this.step = 0;
        this.line1 = null;
    }

    onCanvasClick(x, y) {
        // Try to pick a line
        const hit = this.drawBoard.selectStartObject(x, y, ["DrawLine"]);
        
        if (hit.exist && hit.obj && hit.obj.constructor.name === "DrawLine") {
            if (this.step === 0) {
                this.line1 = hit.obj;
                this.step = 1;
            } else if (this.step === 1) {
                const line2 = hit.obj;
                if (line2 !== this.line1) {
                    const angleData = AngleMeasurementShape.describeAngle(this.line1, line2);
                    if (!angleData) {
                        this.cancel();
                        return;
                    }

                    let measurementId = this.drawBoard.constraintSystem.addGeometry({
                        type: "AngleMeasurement",
                        data: {
                            l1Id: this.line1.constraintId,
                            l2Id: line2.constraintId,
                            value: angleData.angle
                        },
                        fixed: false
                    });

                    // Add proper mathematical constraint!
                    this.drawBoard.constraintSystem.addConstraint({
                        type: "AngleMeasurement",
                        targets: [this.line1.startPoint.constraintId, this.line1.endpoint.constraintId, line2.startPoint.constraintId, line2.endpoint.constraintId],
                        value: angleData.angle,
                        geometryId: measurementId // Link it to the measurement visual
                    });

                    const measurement = new AngleMeasurementShape(this.drawBoard, this.line1, line2);
                    measurement.constraintId = measurementId;
                    this.drawBoard.drawObjects.push(measurement);
                    
                    this.step = 0;
                    this.line1 = null;
                    this.drawBoard.needsUpdate = true;
                    this.drawBoard.saveState();
                    this.drawBoard.draw();
                }
            }
        }
    }

    onMouseMove(x, y) {
        // We can highlight potential lines to pick
    }

    cancel() {
        this.step = 0;
        this.line1 = null;
    }
}