import { BaseTool } from "./BaseTool.js";
import { Geometry } from "../math/Geometry.js";

export class TrimTool extends BaseTool {
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
            this.boundaryShape.color = "red";
            this.drawBoard.draw();
            this.step = 1;
            return;
        }

        if (this.step === 1) {
            let targetLine = snapped.obj;
            if (targetLine.constructor.name !== "DrawLine" || targetLine === this.boundaryShape) return;
            
            let pClick = this.drawBoard.camera.getWorldVec(x, y);

            // Extract line primitive
            let rayPrimitive = Geometry.extractPrimitive(targetLine);
            if (!rayPrimitive) return;

            let startPt = targetLine.startPoint.vec4;
            let dx = rayPrimitive.x2 - rayPrimitive.x1;
            let dy = rayPrimitive.y2 - rayPrimitive.y1;
            let totalLen = Math.sqrt(dx*dx + dy*dy);
            if (totalLen === 0) return;
            let dirX = dx / totalLen;
            let dirY = dy / totalLen;

            let intersections = [];
            
            // Add start and end points as boundaries
            intersections.push({ t: 0, pt: {x: rayPrimitive.x1, y: rayPrimitive.y1}, isStart: true });
            intersections.push({ t: totalLen, pt: {x: rayPrimitive.x2, y: rayPrimitive.y2}, isEnd: true });

            let boundPrim = Geometry.extractPrimitive(this.boundaryShape);
            if (boundPrim) {
                let pts = Geometry.intersectPrimitives(rayPrimitive, boundPrim);
                for (let pt of pts) {
                    let dot = (pt.x - startPt.x) * dirX + (pt.y - startPt.y) * dirY;
                    if (dot > 0.001 && dot < totalLen - 0.001) {
                        intersections.push({ t: dot, pt: pt, isStart: false, isEnd: false, isBoundary: true });
                    }
                }
            }

            // Sort intersections by position along the line
            intersections.sort((a, b) => a.t - b.t);

            // Find where the click point lies
            let clickT = (pClick.x - startPt.x) * dirX + (pClick.y - startPt.y) * dirY;
            
            let bound1 = null;
            let bound2 = null;
            
            for (let i = 0; i < intersections.length - 1; i++) {
                if (clickT >= intersections[i].t && clickT <= intersections[i+1].t) {
                    bound1 = intersections[i];
                    bound2 = intersections[i+1];
                    break;
                }
            }

            if (bound1 && bound2) {
                if (bound1.isStart && bound2.isEnd) {
                    // Clicked between ends with no middle intersection
                    this.drawBoard.deleteObject(targetLine);
                } 
                else if (bound1.isStart) {
                    // Trim start
                    this._movePointAndConstrain(targetLine.startPoint, bound2);
                } 
                else if (bound2.isEnd) {
                    // Trim end
                    this._movePointAndConstrain(targetLine.endpoint, bound1);
                } 
                else {
                    // Trim in the middle
                    this._movePointAndConstrain(targetLine.endpoint, bound1);
                }
                
                this.drawBoard.saveState();
            }

            this.reset();
        }
    }

    _movePointAndConstrain(ptToMove, bound) {
        if (ptToMove.constraintId) {
            let geo = this.constraintSystem.geometries.get(ptToMove.constraintId);
            if (geo) {
                geo.data.x = bound.pt.x;
                geo.data.y = bound.pt.y;
                this.constraintSystem.solveLocal(ptToMove.constraintId);
            }
        }
        ptToMove.vec4.x = bound.pt.x;
        ptToMove.vec4.y = bound.pt.y;

        if (bound.isBoundary && ptToMove.constraintId && this.boundaryShape.constraintId) {
            this.constraintSystem.addConstraint({
                type: "Coincident",
                targets: [ptToMove.constraintId, this.boundaryShape.constraintId]
            });
        }
    }
}
