import { BaseShape } from "./BaseShape.js";
import { Point } from "./Point.js";

export class DrawArc extends BaseShape {
    centerPoint;
    radius;
    startAngle;
    endAngle;

    constructor(ctx, camera, centerPoint, radius, startAngle, endAngle) {
        super(ctx, camera);
        this.centerPoint = centerPoint;
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
    }

    draw() {
        let centerCam = this.centerPoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        let cameraScale = this.camera.getCalcMatrix()[0][0];
        let scaledRadius = this.radius * cameraScale;

        this.ctx.beginPath();
        this.ctx.arc(centerCam.x, centerCam.y, scaledRadius, this.startAngle, this.endAngle);
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();
    }

    check(x, y) {
        let centerCam = this.centerPoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        let cameraScale = this.camera.getCalcMatrix()[0][0];
        let scaledRadius = this.radius * cameraScale;

        let angle = Math.atan2(y - centerCam.y, x - centerCam.x);
        if (angle < 0) angle += 2 * Math.PI;

        let start = this.startAngle;
        let end = this.endAngle;
        if (start < 0) start += 2 * Math.PI;
        if (end < 0) end += 2 * Math.PI;

        let inSector = false;
        if (start < end) {
            inSector = angle >= start && angle <= end;
        } else {
            inSector = angle >= start || angle <= end;
        }

        if (!inSector) {
            // It's not in the angular sector, so it can't be close to the arc proper.
            // We could return distance to the endpoints, but simple check is infinity.
            return Infinity;
        }

        let distToTarget = Math.sqrt(Math.pow(x - centerCam.x, 2) + Math.pow(y - centerCam.y, 2));
        return Math.abs(distToTarget - scaledRadius);
    }

    checkInsideArea(minX, minY, maxX, maxY, requireComplete) {
        // Simple bounding box check for now
        let centerCam = this.centerPoint.vec4.mulMatrix(this.camera.getCalcMatrix());
        let cameraScale = this.camera.getCalcMatrix()[0][0];
        let scaledRadius = this.radius * cameraScale;

        let cx = centerCam.x;
        let cy = centerCam.y;

        if (requireComplete) {
            return cx - scaledRadius >= minX && cx + scaledRadius <= maxX && 
                   cy - scaledRadius >= minY && cy + scaledRadius <= maxY;
        } else {
            // Check if center is inside the box
            if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) return true;

            // Check if closest point on bounding box is within radius
            let closestX = Math.max(minX, Math.min(cx, maxX));
            let closestY = Math.max(minY, Math.min(cy, maxY));

            let distanceX = cx - closestX;
            let distanceY = cy - closestY;
            return (distanceX * distanceX + distanceY * distanceY) <= (scaledRadius * scaledRadius);
        }
    }

    buildProperties(editor) {
        editor.buildPointFields(this.centerPoint, "Center Point");

        let propertiesArea = document.createElement('div');
        propertiesArea.style.marginBottom = "10px";
        propertiesArea.style.padding = "5px";
        propertiesArea.style.border = "1px solid #eee";
        propertiesArea.innerHTML = `<h4 style="margin:0 0 5px 0">Arc Properties</h4>`;
        
        let rInput = editor.createNumberField("Radius", this.radius, (val) => {
            this.radius = val;
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.r = val;
                }
                editor.drawBoard.saveState();
                editor.drawBoard.constraintSystem.solveLocal(this.constraintId);
            }
            editor.drawBoard.draw();
            editor.render();
        });

        let startIn = editor.createNumberField("Start Angle", this.startAngle * 180 / Math.PI, (val) => {
            this.startAngle = val * Math.PI / 180;
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.startAngle = this.startAngle;
                }
                editor.drawBoard.saveState();
                editor.drawBoard.constraintSystem.solveLocal(this.constraintId);
            }
            editor.drawBoard.draw();
            editor.render();
        });

        let endIn = editor.createNumberField("End Angle", this.endAngle * 180 / Math.PI, (val) => {
            this.endAngle = val * Math.PI / 180;
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.endAngle = this.endAngle;
                }
                editor.drawBoard.saveState();
                editor.drawBoard.constraintSystem.solveLocal(this.constraintId);
            }
            editor.drawBoard.draw();
            editor.render();
        });

        propertiesArea.appendChild(rInput);
        propertiesArea.appendChild(startIn);
        propertiesArea.appendChild(endIn);
        editor.container.appendChild(propertiesArea);
    }
}