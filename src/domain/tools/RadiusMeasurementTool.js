import { BaseTool } from "./BaseTool.js";
import { RadiusMeasurementShape } from "../shapes/RadiusMeasurementShape.js";

export class RadiusMeasurementTool extends BaseTool {
    constructor(drawBoard) {
        super(drawBoard);
        this.step = 0;
    }

    onCanvasClick(x, y) {
        // Try to pick a circle
        const hit = this.drawBoard.selectStartObject(x, y, ["DrawCircle", "DrawCircle3P", "DrawCircle2T1R", "DrawCircle3T"]);
        
        if (hit.exist && hit.obj) {
            const circle = hit.obj;

            // Check if there is already a radius measurement constraint for this circle
            let constraintExists = false;
            for (let [cId, cDef] of this.drawBoard.constraintSystem.constraints) {
                if (cDef.type === "RadiusMeasurement" && cDef.targets.includes(circle.constraintId)) {
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
                    circleId: circle.constraintId,
                    value: circle.radius,
                    angle: Math.PI / 4
                },
                fixed: false
            });

            // Add proper mathematical constraint
            this.drawBoard.constraintSystem.addConstraint({
                type: "RadiusMeasurement",
                targets: [circle.constraintId],
                value: circle.radius,
                geometryId: measurementId 
            });

            const measurement = new RadiusMeasurementShape(this.drawBoard, circle);
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
