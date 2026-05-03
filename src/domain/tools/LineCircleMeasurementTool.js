import { BaseTool } from "./BaseTool.js";
import { LineCircleMeasurementShape } from "../shapes/LineCircleMeasurementShape.js";

export class LineCircleMeasurementTool extends BaseTool {
    constructor(drawBoard, constraintSystem) {
        super(drawBoard);
        this.constraintSystem = constraintSystem;
        this.step = 0;
        this.selectedShapes = [];
        this.currentMeasurement = null;
    }

    onCanvasClick(x, y) {
        let snapped = this.drawBoard.selectStartObject(x, y, ["DrawLine", "DrawCircle"]);
        
        if (this.step === 0 && snapped.exist && snapped.obj) {
            this.selectedShapes.push(snapped.obj);
            snapped.obj.changeColor("orange");
            this.step = 1;
            this.drawBoard.draw();
        } 
        else if (this.step === 1 && snapped.exist && snapped.obj) {
            let s2 = snapped.obj;
            if (s2 === this.selectedShapes[0]) return; // Picked same shape

            let t1 = this.selectedShapes[0].constructor.name;
            let t2 = s2.constructor.name;

            let lineShape = t1 === "DrawLine" ? this.selectedShapes[0] : (t2 === "DrawLine" ? s2 : null);
            let circShape = t1 === "DrawCircle" ? this.selectedShapes[0] : (t2 === "DrawCircle" ? s2 : null);

            if (!lineShape || !circShape) {
                console.warn("Please select one Line and one Circle.");
                return;
            }

            s2.changeColor("orange");
            this.selectedShapes.push(s2);
            
            // Generate visual placeholder
            this.currentMeasurement = new LineCircleMeasurementShape(this.drawBoard, lineShape, circShape);
            this.step = 2;
            this.drawBoard.drawTempObjects = [this.currentMeasurement];
            this.drawBoard.needsUpdate = true;
            this.drawBoard.draw();
        }
        else if (this.step === 2) {
            let lineShape = this.selectedShapes.find(s => s.constructor.name === "DrawLine");
            let circShape = this.selectedShapes.find(s => s.constructor.name === "DrawCircle");

            let p1 = lineShape.p1;
            let p2 = lineShape.p2;
            let center = circShape.center;
            
            let x0 = center.x, y0 = center.y;
            let x1 = p1.x, y1 = p1.y;
            let x2 = p2.x, y2 = p2.y;
            
            let num = (x2 - x1)*(y1 - y0) - (x1 - x0)*(y2 - y1);
            let den = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            
            let val = 0;
            if (den > 0) {
                val = (Math.abs(num) / den) - circShape.radius;
            }

            let measurementId = this.drawBoard.constraintSystem.addGeometry({
                type: "LineCircleMeasurement",
                data: { 
                    lId: lineShape.constraintId, 
                    cId: circShape.constraintId,
                    value: val
                },
                fixed: false
            });

            this.drawBoard.constraintSystem.addConstraint({
                type: "LineCircleMeasurement",
                targets: [lineShape.constraintId, circShape.constraintId],
                value: val,
                geometryId: measurementId
            });

            this.currentMeasurement.constraintId = measurementId;
            this.drawBoard.drawObjects.push(this.currentMeasurement);
            
            this.selectedShapes.forEach(s => s.changeColor("red"));
            this.step = 0;
            this.selectedShapes = [];
            this.currentMeasurement = null;
            this.drawBoard.drawTempObjects = [];
            this.drawBoard.needsUpdate = true;
            this.drawBoard.draw();
        }
    }

    onMouseMove(x, y) {
        if (this.step === 2 && this.currentMeasurement) {
            let worldVec = this.drawBoard.camera.getWorldVec(x, y);
            if (this.currentMeasurement.moveAnchor) {
                this.currentMeasurement.moveAnchor(worldVec.x, worldVec.y);
            }
            this.drawBoard.needsUpdate = true;
        }
    }

    cancel() {
        this.selectedShapes.forEach(s => s.changeColor("red"));
        this.step = 0;
        this.selectedShapes = [];
        this.currentMeasurement = null;
        this.drawBoard.drawTempObjects = [];
        this.drawBoard.needsUpdate = true;
    }
}