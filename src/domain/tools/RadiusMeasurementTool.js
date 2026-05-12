import { BaseTool } from "./BaseTool.js";
import { RadiusMeasurementShape } from "../shapes/RadiusMeasurementShape.js";

export class RadiusMeasurementTool extends BaseTool {
    constructor(drawBoard) {
        super(drawBoard);
        this.step = 0;
    }

    onCanvasClick(x, y) {
        // Try to pick a circular shape
        const hit = this.drawBoard.selectStartObject(x, y, ["DrawCircle", "DrawCircle3P", "DrawCircle2T1R", "DrawCircle3T", "DrawArc"]);
        
        if (hit.exist && hit.obj) {
            const circularShape = hit.obj;

            // Check if there is already a radius measurement constraint for this shape
            let constraintExists = false;
            for (let [cId, cDef] of this.drawBoard.constraintSystem.constraints) {
                if (cDef.type === "RadiusMeasurement" && cDef.targets.includes(circularShape.constraintId)) {
                    constraintExists = true;
                    break;
                }
            }

            if (constraintExists) {
                return; // Prevent duplicate active constraints on the same radius
            }

            let measurementId = this.drawBoard.constraintSystem.addGeometry({
                type: "RadiusMeasurement",
                data: {
                    circleId: circularShape.constraintId,
                    value: circularShape.radius,
                    angle: Math.PI / 4
                },
                fixed: false
            });

            // Add proper mathematical constraint
            this.drawBoard.constraintSystem.addConstraint({
                type: "RadiusMeasurement",
                targets: [circularShape.constraintId],
                value: circularShape.radius,
                geometryId: measurementId 
            });

            const measurement = new RadiusMeasurementShape(this.drawBoard, circularShape);
            measurement.constraintId = measurementId;
            this.drawBoard.drawObjects.push(measurement);
            
            this.drawBoard.needsUpdate = true;
            this.drawBoard.draw();
        }
    }

    onMouseMove(x, y) {
        // Highlighting handled by DrawBoard automatically
    }

    cancel() {
        this.step = 0;
    }
}
