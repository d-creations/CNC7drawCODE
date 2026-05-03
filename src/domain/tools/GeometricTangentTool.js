import { BaseTool } from "./BaseTool.js";
import { GeometricTangentShape } from "../shapes/GeometricTangentShape.js";

export class GeometricTangentTool extends BaseTool {
    constructor(drawBoard) {
        super(drawBoard);
        this.step = 0;
        this.s1 = null; 
    }

    onCanvasClick(x, y) {
        // Can snap to Lines or Circles
        let snapped = this.drawBoard.selectStartObject(x, y, ["DrawLine", "DrawCircle"]);
        if (!snapped.exist || !snapped.obj || !snapped.obj.constraintId) {
            return; // Must select constrained shapes
        }

        let shapeObj = snapped.obj;

        if (this.step === 0) {
            this.s1 = shapeObj;
            this.step = 1;
            this.s1.changeColor("orange");
            this.drawBoard.draw();
        } else if (this.step === 1) {
            const s2 = shapeObj;
            if(s2 === this.s1) return; // ignore same shape

            // Tangent generally works between (Line & Circle) or (Circle & Circle). 
            // We ignore Line & Line since that's parallelism, not tangency.
            const type1 = this.s1.constructor.name;
            const type2 = s2.constructor.name;

            if (type1 === "DrawLine" && type2 === "DrawLine") {
                console.warn("Tangent cannot be applied between two lines.");
                this.cancel();
                return;
            }

            // Create geometry node for the Constraint UI link
            let shapeId = this.drawBoard.constraintSystem.addGeometry({
                type: "GeometricTangent",
                data: { target1Id: this.s1.constraintId, target2Id: s2.constraintId },
                fixed: false
            });

            // Add the math rule to the Non-Linear solver
            this.drawBoard.constraintSystem.addConstraint({
                type: "Tangent",
                targets: [this.s1.constraintId, s2.constraintId],
                geometryId: shapeId
            });

            // Render it and hold properties
            let visualShape = new GeometricTangentShape(this.drawBoard, this.s1, s2);
            visualShape.constraintId = shapeId;
            this.drawBoard.drawObjects.push(visualShape);
            
            this.s1.changeColor("red"); // Restore default selection or clear
            this.step = 0;
            this.s1 = null;
            this.drawBoard.drawTempObjects = [];
            this.drawBoard.needsUpdate = true;
            this.drawBoard.saveState();
            this.drawBoard.draw();
        }
    }

    onMouseMove(x, y) {
        // Hover visual
    }

    cancel() {
        if(this.s1 && this.s1.changeColor) this.s1.changeColor("red");
        this.step = 0;
        this.s1 = null;
        this.drawBoard.drawTempObjects = [];
        this.drawBoard.needsUpdate = true;
        this.drawBoard.draw();
    }
}