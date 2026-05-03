import { BaseTool } from "./BaseTool.js";
import { GeometricVerticalShape } from "../shapes/GeometricVerticalShape.js";

export class GeometricVerticalTool extends BaseTool {
    constructor(drawBoard) {
        super(drawBoard);
        this.step = 0;
        this.p1 = null; 
    }

    onCanvasClick(x, y) {
        let snapped = this.drawBoard.selectStartObject(x, y, ["Point"]);
        if (!snapped.exist || !snapped.obj || !snapped.obj.vec4) {
            return; // Must select existing points for geometric constraints
        }

        let pObj = snapped.obj;

        if (this.step === 0) {
            this.p1 = pObj;
            this.step = 1;
            // Optionally highlight p1
            this.p1.changeColor("orange");
            this.drawBoard.draw();
        } else if (this.step === 1) {
            const p2 = pObj;
            if(p2 === this.p1) return; // ignore same point
            
            // Add non-dimensional vertical constraint
            let shapeId = this.drawBoard.constraintSystem.addGeometry({
                type: "GeometricVertical",
                data: { p1Id: this.p1.constraintId, p2Id: p2.constraintId },
                fixed: false
            });

            this.drawBoard.constraintSystem.addConstraint({
                type: "Vertical",
                targets: [this.p1.constraintId, p2.constraintId],
                geometryId: shapeId
            });

            let visualShape = new GeometricVerticalShape(this.drawBoard, this.p1, p2);
            visualShape.constraintId = shapeId;
            this.drawBoard.drawObjects.push(visualShape);
            
            this.p1.changeColor("red"); // reset to whatever default selection was, or clear
            this.step = 0;
            this.p1 = null;
            this.drawBoard.drawTempObjects = [];
            this.drawBoard.needsUpdate = true;
            this.drawBoard.saveState();
            this.drawBoard.draw();
        }
    }

    onMouseMove(x, y) {
        // Visual indicator could be added if waiting for second point
    }

    cancel() {
        if(this.p1 && this.p1.changeColor) this.p1.changeColor("red");
        this.step = 0;
        this.p1 = null;
        this.drawBoard.drawTempObjects = [];
        this.drawBoard.needsUpdate = true;
        this.drawBoard.draw();
    }
}