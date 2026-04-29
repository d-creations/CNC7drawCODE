import { BaseShape } from "./BaseShape.js";
import { Point } from "./Point.js";

export class DrawArc extends BaseShape {
    centerPoint;
    radius;
    startAngle;
    endAngle;

    constructor(centerPoint, radius, startAngle, endAngle) {
        super();
        this.centerPoint = centerPoint;
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
    }

    getRenderData() {
        return [
            {
                primitive: 'arc',
                worldX: this.centerPoint.vec4.x,
                worldY: this.centerPoint.vec4.y,
                worldRadius: this.radius,
                startAngle: this.startAngle,
                endAngle: this.endAngle,
                color: this.color,
                stroke: true
            }
        ];
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