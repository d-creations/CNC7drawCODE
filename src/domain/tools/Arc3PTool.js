import { BaseTool } from "./BaseTool.js";
import { Point } from "../shapes/Point.js";
import { DrawArc } from "../shapes/DrawArc.js";
import { Vec4 } from "../Camera.js";

/**
 * Tool for creating an Arc via Start Point, End Point, and a point on the circumference.
 * - Click 1: Start Point
 * - Click 2: End Point
 * - Click 3: Radius Point (defines the arc's curvature)
 */
export class Arc3PTool extends BaseTool {
    constructor(drawBoard, constraintSystem) {
        super(drawBoard);
        this.constraintSystem = constraintSystem;
        this.step = "placeStart"; 
        this.pStart = null;
        this.pEnd = null;
    }

    onCanvasClick(x, y) {
        let worldVec = this.drawBoard.camera.getWorldVec(x, y);

        if (this.step === "placeStart") {
            this.pStart = { x: worldVec.x, y: worldVec.y };
            this.step = "placeEnd";

        } else if (this.step === "placeEnd") {
            this.pEnd = { x: worldVec.x, y: worldVec.y };
            this.step = "placeRadius";

        } else if (this.step === "placeRadius") {
            let pC = { x: worldVec.x, y: worldVec.y };
            let arcData = this.calculateArc(this.pStart, this.pEnd, pC);

            if (arcData) {
                // Build constraint primitive for Arc Center
                let centerId = this.constraintSystem.addGeometry({
                    type: "Point",
                    data: { x: arcData.cx, y: arcData.cy },
                    fixed: false
                });

                let arcId = this.constraintSystem.addGeometry({
                    type: "Arc",
                    data: { center: centerId, r: arcData.r, startAngle: arcData.startAngle, endAngle: arcData.endAngle },
                    fixed: false
                });

                let centerPointObj = new Point(new Vec4(arcData.cx, arcData.cy, 0, 1));
                centerPointObj.constraintId = centerId;
                this.drawBoard.drawObjects.push(centerPointObj);

                let arcObj = new DrawArc(centerPointObj, arcData.r, arcData.startAngle, arcData.endAngle);
                arcObj.constraintId = arcId;
                this.drawBoard.drawObjects.push(arcObj);
            }

            // Clean up temps
            this.reset();
        }
    }

    onMouseMove(position) {
        if (this.step === "placeEnd") {
            let worldVec = this.drawBoard.camera.getWorldVec(position.x, position.y);
            this.drawBoard.clearTempObjects();
            // Just draw a dashed line previewing the start to end distance
            this.drawBoard.context.save();
            this.drawBoard.context.beginPath();
            let p1Cam = new Vec4(this.pStart.x, this.pStart.y, 0, 1).mulMatrix(this.drawBoard.camera.getCalcMatrix());
            let p2Cam = new Vec4(worldVec.x, worldVec.y, 0, 1).mulMatrix(this.drawBoard.camera.getCalcMatrix());
            this.drawBoard.context.moveTo(p1Cam.x, p1Cam.y);
            this.drawBoard.context.lineTo(p2Cam.x, p2Cam.y);
            this.drawBoard.context.strokeStyle = "gray";
            this.drawBoard.context.setLineDash([5, 5]);
            this.drawBoard.context.stroke();
            this.drawBoard.context.restore();
            
        } else if (this.step === "placeRadius") {
            let worldVec = this.drawBoard.camera.getWorldVec(position.x, position.y);
            let arcData = this.calculateArc(this.pStart, this.pEnd, { x: worldVec.x, y: worldVec.y });
            
            this.drawBoard.clearTempObjects();
            
            if (arcData) {
                let cPoint = new Point(new Vec4(arcData.cx, arcData.cy, 0, 1));
                let previewArc = new DrawArc(cPoint, arcData.r, arcData.startAngle, arcData.endAngle);
                previewArc.changeColor("green");
                this.drawBoard.drawTempObjects.push(previewArc);
            }
            this.drawBoard.draw();
        }
    }

    calculateArc(A, B, C) {
        // Find circumcenter
        let D = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
        if (Math.abs(D) < 1e-9) return null; // Collinear, straight line instead of arc

        let cx = ((A.x*A.x + A.y*A.y) * (B.y - C.y) + (B.x*B.x + B.y*B.y) * (C.y - A.y) + (C.x*C.x + C.y*C.y) * (A.y - B.y)) / D;
        let cy = ((A.x*A.x + A.y*A.y) * (C.x - B.x) + (B.x*B.x + B.y*B.y) * (A.x - C.x) + (C.x*C.x + C.y*C.y) * (B.x - A.x)) / D;

        let r = Math.sqrt((A.x - cx)**2 + (A.y - cy)**2);

        // Calculate angles
        let a1 = Math.atan2(A.y - cy, A.x - cx);
        let a2 = Math.atan2(B.y - cy, B.x - cx);
        let a3 = Math.atan2(C.y - cy, C.x - cx);

        a1 = (a1 + 2 * Math.PI) % (2 * Math.PI);
        a2 = (a2 + 2 * Math.PI) % (2 * Math.PI);
        a3 = (a3 + 2 * Math.PI) % (2 * Math.PI);

        // Verify if a3 is swept in a CCW direction from a1 to a2
        let sweep = (a2 - a1 + 2 * Math.PI) % (2 * Math.PI);
        let midSweep = (a3 - a1 + 2 * Math.PI) % (2 * Math.PI);

        let startAngle, endAngle;
        if (midSweep < sweep) {
            startAngle = a1; 
            endAngle = a2;
        } else {
            startAngle = a2;
            endAngle = a1;
        }

        return { cx, cy, r, startAngle, endAngle };
    }

    reset() {
        this.step = "placeStart";
        this.pStart = null;
        this.pEnd = null;
        this.drawBoard.clearTempObjects();
        this.drawBoard.draw();
    }
}