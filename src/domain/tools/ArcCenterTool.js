import { BaseTool } from "./BaseTool.js";
import { Point } from "../shapes/Point.js";
import { DrawArc } from "../shapes/DrawArc.js";
import { Vec4 } from "../Camera.js";

/**
 * Tool for creating an Arc via Center, Start Point, and End Point.
 * - Click 1: Center
 * - Click 2: Start Point (Defines Radius + Start Angle)
 * - Click 3: End Point (Defines End Angle)
 */
export class ArcCenterTool extends BaseTool {
    constructor(drawBoard, constraintSystem) {
        super(drawBoard);
        this.constraintSystem = constraintSystem;
        this.step = "placeCenter"; 
        this.pCenter = null;
        this.pStart = null;
        this.tempArc = null;
        this.tempPointS = null;
        this.tempPointE = null;
    }

    onCanvasClick(x, y) {
        let worldVec = this.drawBoard.camera.getWorldVec(x, y);

        if (this.step === "placeCenter") {
            let centerId = this.constraintSystem.addGeometry({
                type: "Point",
                data: { x: worldVec.x, y: worldVec.y },
                fixed: false
            });
            this.pCenter = { id: centerId, x: worldVec.x, y: worldVec.y };

            let centerPointObj = new Point(new Vec4(worldVec.x, worldVec.y, 0, 1));
            centerPointObj.constraintId = centerId;
            this.drawBoard.drawObjects.push(centerPointObj);

            this.step = "placeStart";

        } else if (this.step === "placeStart") {
            let startId = this.constraintSystem.addGeometry({
                type: "Point",
                data: { x: worldVec.x, y: worldVec.y },
                fixed: false
            });
            this.pStart = { id: startId, x: worldVec.x, y: worldVec.y };

            let startPointObj = new Point(new Vec4(worldVec.x, worldVec.y, 0, 1));
            startPointObj.constraintId = startId;
            this.drawBoard.drawObjects.push(startPointObj);

            this.step = "placeEnd";

        } else if (this.step === "placeEnd") {
            let endX = worldVec.x;
            let endY = worldVec.y;

            // Calculate radius and angles
            let dxStart = this.pStart.x - this.pCenter.x;
            let dyStart = this.pStart.y - this.pCenter.y;
            let radius = Math.sqrt(dxStart * dxStart + dyStart * dyStart);

            let startAngle = Math.atan2(dyStart, dxStart);
            let endAngle = Math.atan2(endY - this.pCenter.y, endX - this.pCenter.x);

            if (startAngle < 0) startAngle += 2 * Math.PI;
            if (endAngle < 0) endAngle += 2 * Math.PI;

            // Build constraint primitive for Arc
            let arcId = this.constraintSystem.addGeometry({
                type: "Arc",
                data: { center: this.pCenter.id, r: radius, startAngle: startAngle, endAngle: endAngle },
                fixed: false
            });

            // We constrain the START point to be coincident with the start angle (Optionally, could use distance + angle constraints)
            // For now, distance constraint so start point controls radius:
            this.constraintSystem.addConstraint({ 
                type: "Distance", 
                targets: [this.pCenter.id, this.pStart.id],
                value: radius
            });

            // We add an Arc measurement so the arc radius tracks the start distance?
            // Actually, the simplest is tangling the arc internally or using constraints. 
            // We just let the Arc hold its fixed values for now.

            let centerPointObj = this.drawBoard.drawObjects.find(o => o.constraintId === this.pCenter.id);
            let arcObj = new DrawArc(centerPointObj, radius, startAngle, endAngle);
            arcObj.constraintId = arcId;

            this.drawBoard.drawObjects.push(arcObj);

            // Clean up temps
            this.reset();
        }
    }

    onMouseMove(position) {
        if (this.step === "placeStart") {
            // Preview radius
            let worldVec = this.drawBoard.camera.getWorldVec(position.x, position.y);
            let dx = worldVec.x - this.pCenter.x;
            let dy = worldVec.y - this.pCenter.y;
            let r = Math.sqrt(dx*dx + dy*dy);
            
            this.drawBoard.clearTempObjects();
            let cPoint = new Point(this.drawBoard.context, this.drawBoard.camera, new Vec4(this.pCenter.x, this.pCenter.y, 0, 1));
            let tempCircle = new DrawArc(this.drawBoard.context, this.drawBoard.camera, cPoint, r, 0, Math.PI * 2);
            tempCircle.changeColor("gray");
            this.drawBoard.drawTempObjects.push(tempCircle);
            this.drawBoard.draw();
        } else if (this.step === "placeEnd") {
            // Preview arc
            let worldVec = this.drawBoard.camera.getWorldVec(position.x, position.y);
            let dxStart = this.pStart.x - this.pCenter.x;
            let dyStart = this.pStart.y - this.pCenter.y;
            let r = Math.sqrt(dxStart*dxStart + dyStart*dyStart);

            let startAngle = Math.atan2(dyStart, dxStart);
            let endAngle = Math.atan2(worldVec.y - this.pCenter.y, worldVec.x - this.pCenter.x);

            if (startAngle < 0) startAngle += 2 * Math.PI;
            if (endAngle < 0) endAngle += 2 * Math.PI;

            this.drawBoard.clearTempObjects();
            let cPoint = new Point(this.drawBoard.context, this.drawBoard.camera, new Vec4(this.pCenter.x, this.pCenter.y, 0, 1));
            let previewArc = new DrawArc(this.drawBoard.context, this.drawBoard.camera, cPoint, r, startAngle, endAngle);
            previewArc.changeColor("green");
            this.drawBoard.drawTempObjects.push(previewArc);
            this.drawBoard.draw();
        }
    }

    reset() {
        this.step = "placeCenter";
        this.pCenter = null;
        this.pStart = null;
        this.drawBoard.clearTempObjects();
        this.drawBoard.draw();
    }
}