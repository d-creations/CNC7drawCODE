import { BaseTool } from "./BaseTool.js";
import { GeometricVerticalShape } from "../shapes/GeometricVerticalShape.js";
import { isObjectType } from '../core/ObjectType.js';

export class GeometricVerticalTool extends BaseTool {
    constructor(drawBoard) {
        super(drawBoard);
        this.step = 0;
        this.p1 = null; 
    }

    resolveConstraintTarget(x, y) {
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

    applyConstraint(p1, p2) {
        if (p1 === p2) return;

        let shapeId = this.drawBoard.constraintSystem.addGeometry({
            type: "GeometricVertical",
            data: { p1Id: p1.constraintId, p2Id: p2.constraintId },
            fixed: false
        });

        this.drawBoard.constraintSystem.addConstraint({
            type: "Vertical",
            targets: [p1.constraintId, p2.constraintId],
            geometryId: shapeId
        });

        let visualShape = new GeometricVerticalShape(this.drawBoard, p1, p2);
        visualShape.constraintId = shapeId;
        this.drawBoard.drawObjects.push(visualShape);

        if (this.p1 && this.p1.changeColor) this.p1.changeColor("red");
        this.step = 0;
        this.p1 = null;
        this.drawBoard.drawTempObjects = [];
        this.drawBoard.needsUpdate = true;
        this.drawBoard.saveState();
        this.drawBoard.draw();
    }

    onCanvasClick(x, y) {
        const target = this.resolveConstraintTarget(x, y);
        if (this.step === 0 && target.type === "shape") {
            this.applyConstraint(target.startPoint, target.endPoint);
            return;
        }

        if (target.type !== "point") return;

        let pObj = target.point;

        if (this.step === 0) {
            this.p1 = pObj;
            this.step = 1;
            // Optionally highlight p1
            this.p1.changeColor("orange");
            this.drawBoard.draw();
        } else if (this.step === 1) {
            this.applyConstraint(this.p1, pObj);
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