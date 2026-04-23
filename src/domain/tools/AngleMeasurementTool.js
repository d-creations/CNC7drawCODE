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
                    
                    // Calc initial angle
                    let a1 = Math.atan2(this.line1.endpoint.vec4.y - this.line1.startPoint.vec4.y, this.line1.endpoint.vec4.x - this.line1.startPoint.vec4.x);
                    let a2 = Math.atan2(line2.endpoint.vec4.y - line2.startPoint.vec4.y, line2.endpoint.vec4.x - line2.startPoint.vec4.x);
                    let diff = a2 - a1;
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    while (diff < -Math.PI) diff += 2 * Math.PI;

                    let measurementId = this.drawBoard.constraintSystem.addGeometry({
                        type: "AngleMeasurement",
                        data: {
                            l1Id: this.line1.constraintId,
                            l2Id: line2.constraintId,
                            value: Math.abs(diff)
                        },
                        fixed: false
                    });

                    // Add proper mathematical constraint!
                    this.drawBoard.constraintSystem.addConstraint({
                        type: "AngleMeasurement",
                        targets: [this.line1.startPoint.constraintId, this.line1.endpoint.constraintId, line2.startPoint.constraintId, line2.endpoint.constraintId],
                        value: Math.abs(diff),
                        geometryId: measurementId // Link it to the measurement visual
                    });

                    const measurement = new AngleMeasurementShape(this.drawBoard, this.line1, line2);
                    measurement.constraintId = measurementId;
                    this.drawBoard.drawObjects.push(measurement);
                    
                    this.step = 0;
                    this.line1 = null;
                    this.drawBoard.needsUpdate = true;
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