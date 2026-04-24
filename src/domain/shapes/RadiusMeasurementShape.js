import { BaseMeasurementShape } from "./BaseMeasurementShape.js";
import { Vec4 } from "../Camera.js";

export class RadiusMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, circle) {
        super(drawBoard.context, drawBoard.camera);
        this.drawBoard = drawBoard;
        this.circle = circle;
        this.angle = Math.PI / 4; // Default angle for measurement line
        this.type = "RadiusMeasurement";
    }

    draw() {
        if (!this.circle || !this.circle.centerPoint) return;

        const ctx = this.drawBoard.context;
        const camera = this.drawBoard.camera;
        const scale = camera.getCalcMatrix()[0][0];

        const centerCam = this.circle.centerPoint.vec4.mulMatrix(camera.getCalcMatrix());
        const scaledRadius = this.circle.radius * scale;

        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;

        // Edge point
        const ex = centerCam.x + Math.cos(this.angle) * scaledRadius;
        const ey = centerCam.y - Math.sin(this.angle) * scaledRadius; // Y acts upwards? Actually screen Y is inverted, wait... 

        // Let's stick with std screen coordinates in DrawBoard:
        const screenAng = -this.angle; 
        const sx = centerCam.x + Math.cos(screenAng) * scaledRadius;
        const sy = centerCam.y + Math.sin(screenAng) * scaledRadius;

        // Draw line from center to edge, and slightly past it
        ctx.beginPath();
        ctx.moveTo(centerCam.x, centerCam.y);
        
        const extLen = 20;
        const lx = centerCam.x + Math.cos(screenAng) * (scaledRadius + extLen);
        const ly = centerCam.y + Math.sin(screenAng) * (scaledRadius + extLen);
        
        ctx.lineTo(lx, ly);

        // Draw arrow at the edge
        const arrowSize = 10;
        const arrowAng = Math.PI / 6;
        
        const a1x = sx - Math.cos(screenAng - arrowAng) * arrowSize;
        const a1y = sy - Math.sin(screenAng - arrowAng) * arrowSize;
        const a2x = sx - Math.cos(screenAng + arrowAng) * arrowSize;
        const a2y = sy - Math.sin(screenAng + arrowAng) * arrowSize;

        ctx.moveTo(a1x, a1y);
        ctx.lineTo(sx, sy);
        ctx.lineTo(a2x, a2y);

        ctx.stroke();

        // compute label
        const r_text = "R" + this.circle.radius.toFixed(2);

        // We draw text centered, slightly offset from the line
        ctx.translate(lx, ly);
        
        const charSize = 8;
        const textWidth = r_text.length * charSize * 1.5;
        this.drawStickText(ctx, r_text, 5, -charSize/2, charSize, this.color);

        ctx.restore();
    }

    check(x, y, zoom) {
        if (!this.circle) return Infinity;

        const camera = this.drawBoard.camera;
        const scale = camera.getCalcMatrix()[0][0];
        const centerCam = this.circle.centerPoint.vec4.mulMatrix(camera.getCalcMatrix());
        const scaledRadius = this.circle.radius * scale;

        const screenAng = -this.angle;
        const extLen = 20;
        const lx = centerCam.x + Math.cos(screenAng) * (scaledRadius + extLen);
        const ly = centerCam.y + Math.sin(screenAng) * (scaledRadius + extLen);

        const screenLen = scaledRadius + extLen;
        if (screenLen < 1) return Infinity;

        let num = Math.abs((lx - centerCam.x) * (centerCam.y - y) - (centerCam.x - x) * (ly - centerCam.y));
        let d = num / screenLen;

        let dotProduct = ((x - centerCam.x) * (lx - centerCam.x) + (y - centerCam.y) * (ly - centerCam.y)) / screenLen;
        if (dotProduct < -20 || dotProduct > screenLen + 20) {
            return Infinity;
        }

        return d;
    }

    buildProperties(editor) {
        let divArea = document.createElement('div');
        divArea.style.marginBottom = "10px";
        divArea.style.padding = "5px";
        divArea.style.border = "1px solid #eee";
        divArea.innerHTML = `<h4 style="margin:0 0 5px 0">Radius Measurement (Constraint)</h4>`;

        let angleInput = editor.createNumberField("Angle", this.angle * 180 / Math.PI, (val) => {
            this.angle = val * Math.PI / 180;
            
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.angle = this.angle;
                    editor.drawBoard.saveState();
                }
            }
            editor.drawBoard.draw();
        });

        let radiusInput = editor.createNumberField("Radius (mm)", this.circle.radius, (val) => {
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.value = val;
                }

                let found = false;
                // Update ALL matching constraints so they don't fight
                for (let [cId, cDef] of editor.drawBoard.constraintSystem.constraints) {
                    if (cDef.geometryId === this.constraintId || (cDef.type === "RadiusMeasurement" && cDef.targets.includes(this.circle.constraintId))) {
                        cDef.value = val;
                        cDef.geometryId = this.constraintId;
                        found = true;
                        // Don't break, update all duplicates if they exist to fix the broken state
                    }
                }

                if (!found) {
                    editor.drawBoard.constraintSystem.addConstraint({
                        type: "RadiusMeasurement",
                        targets: [this.circle.constraintId],
                        value: val,
                        geometryId: this.constraintId
                    });
                }
                
                editor.drawBoard.constraintSystem.solveLocal(this.circle.constraintId);
            } else {
                this.circle.radius = val; 
            }

            this.circle.radius = val;
            
            editor.drawBoard.saveState();
            editor.drawBoard.draw();
            editor.render();
        });

        divArea.appendChild(angleInput);
        divArea.appendChild(radiusInput);
        editor.container.appendChild(divArea);
    }
}
