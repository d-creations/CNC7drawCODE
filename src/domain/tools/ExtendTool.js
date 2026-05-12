import { BaseTool } from "./BaseTool.js";
import { Geometry } from "../math/Geometry.js";
import { Vec4 } from '../viewController/Camera.js';

export class ExtendTool extends BaseTool {
    constructor(drawBoard, constraintSystem) {
        super(drawBoard);
        this.constraintSystem = constraintSystem;
        this.step = 0;
        this.boundaryShape = null;
    }

    reset() {
        super.reset();
        this.step = 0;
        if (this.boundaryShape) {
            this.boundaryShape.color = this.boundaryShape.defaultColor || "black";
        }
        this.boundaryShape = null;
    }

    onCanvasClick(x, y) {
        let snapped = this.drawBoard.selectStartObject(x, y, ["DrawLine", "DrawCircle", "DrawArc"]);
        if (!snapped.exist || !snapped.obj) return;
        
        if (this.step === 0) {
            this.boundaryShape = snapped.obj;
            // Highlight it temporarily
            this.boundaryShape.defaultColor = this.boundaryShape.color;
            this.boundaryShape.color = "blue";
            this.drawBoard.draw();
            this.step = 1;
            return;
        }

        if (this.step === 1) {
            let targetLine = snapped.obj;
            if (targetLine.constructor.name !== "DrawLine" || targetLine === this.boundaryShape) return;

            let pClick = this.drawBoard.camera.getWorldVec(x, y);

            // Determine which end of the line is closer to the click
            let startPt = targetLine.startPoint.vec4;
            let endPt = targetLine.endpoint.vec4;

            let dStart = Geometry.distance(pClick, startPt);
            let dEnd = Geometry.distance(pClick, endPt);
            
            // Ray direction
            let isStart = dStart < dEnd;
            let origin = isStart ? startPt : endPt;
            let other = isStart ? endPt : startPt;
            
            let dx = origin.x - other.x;
            let dy = origin.y - other.y;
            let len = Math.sqrt(dx*dx + dy*dy);
            if (len === 0) return;

            let dirX = dx / len;
            let dirY = dy / len;

            // Build a long ray as a primitive
            const INFINITY = 10000;
            let rayPrimitive = {
                type: "line",
                x1: origin.x,
                y1: origin.y,
                x2: origin.x + dirX * INFINITY,
                y2: origin.y + dirY * INFINITY
            };

            let boundPrim = Geometry.extractPrimitive(this.boundaryShape);
            if (!boundPrim) return;

            let intersections = Geometry.intersectPrimitives(rayPrimitive, boundPrim);
            let bestDistance = Infinity;
            let bestIntersection = null;

            for (let pt of intersections) {
                // Check if the intersection is physically in the direction of the ray
                let dot = (pt.x - origin.x) * dirX + (pt.y - origin.y) * dirY;
                if (dot > 0.001) { // must be strictly ahead
                    if (dot < bestDistance) {
                        bestDistance = dot;
                        bestIntersection = pt;
                    }
                }
            }

            if (bestIntersection) {
                // Modify the line's endpoint
                let ptToMove = isStart ? targetLine.startPoint : targetLine.endpoint;
                
                // Update constraint system data
                if (ptToMove.constraintId) {
                    let geo = this.constraintSystem.geometries.get(ptToMove.constraintId);
                    if (geo) {
                        geo.data.x = bestIntersection.x;
                        geo.data.y = bestIntersection.y;
                        this.constraintSystem.solveLocal(ptToMove.constraintId);
                    }
                }
                
                ptToMove.vec4.x = bestIntersection.x;
                ptToMove.vec4.y = bestIntersection.y;
                
                // Add Coincident constraint
                if (ptToMove.constraintId && this.boundaryShape.constraintId) {
                    this.constraintSystem.addConstraint({
                        type: "Coincident",
                        targets: [ptToMove.constraintId, this.boundaryShape.constraintId]
                    });
                }
                
                this.drawBoard.saveState();
            }

            this.reset();
        }
    }
}
