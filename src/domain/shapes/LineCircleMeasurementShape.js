import { BaseMeasurementShape } from "./BaseMeasurementShape.js";

export class LineCircleMeasurementShape extends BaseMeasurementShape {
    constructor(drawBoard, lineShape, circleShape) {
        super();
        this.drawBoard = drawBoard;
        this.lineShape = lineShape;
        this.circleShape = circleShape;
        this.offset = 20; // visual offset distance
        this.type = "LineCircleMeasurement";
    }

    getRenderData() {
        if (!this.lineShape || !this.circleShape) return [];
        
        let p1 = this.lineShape.p1;
        let p2 = this.lineShape.p2;
        let center = this.circleShape.center;
        
        let x0 = center.x, y0 = center.y;
        let x1 = p1.x, y1 = p1.y;
        let x2 = p2.x, y2 = p2.y;
        
        let num = (x2 - x1)*(y1 - y0) - (x1 - x0)*(y2 - y1);
        let den = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        if (den === 0) return [];
        
        let centerDist = Math.abs(num) / den;
        let edgeDist = centerDist - this.circleShape.radius;

        // Visual presentation: Draw a simple length dimension 
        // We evaluate projection point of center onto line
        let t = ((x0 - x1)*(x2 - x1) + (y0 - y1)*(y2 - y1)) / (den*den);
        let projX = x1 + t*(x2 - x1);
        let projY = y1 + t*(y2 - y1);

        // Vector from center to proj
        let dx = projX - x0;
        let dy = projY - y0;
        let len = Math.sqrt(dx*dx + dy*dy);
        
        if (len === 0) return [];

        let nx = dx / len;
        let ny = dy / len;

        // Closest point on circle edge
        let edgeX = x0 + nx * this.circleShape.radius;
        let edgeY = y0 + ny * this.circleShape.radius;

        return [{
            primitive: 'dimension_length',
            worldP1: { x: edgeX, y: edgeY },
            worldP2: { x: projX, y: projY },
            offset: this.offset,
            textAnchor: this.textAnchor,
            text: edgeDist.toFixed(2),
            color: this.color
        }];
    }

    moveAnchor(newX, newY) {
        super.moveAnchor(newX, newY);
        // simple offset scaling
        const cx = (this.lineShape.p1.x + this.lineShape.p2.x + this.circleShape.center.x) / 3;
        const cy = (this.lineShape.p1.y + this.lineShape.p2.y + this.circleShape.center.y) / 3;
        this.offset = Math.sqrt(Math.pow(newX - cx, 2) + Math.pow(newY - cy, 2));
    }


    buildProperties(editor) {
        let divArea = document.createElement('div');
        divArea.style.marginBottom = "10px";
        divArea.style.padding = "5px";
        divArea.style.border = "1px solid #eee";
        divArea.innerHTML = `<h4 style="margin:0 0 5px 0">Line-Circle Distance</h4>`;

        let offsetInput = editor.createNumberField("Offset", this.offset, (val) => {
            this.offset = val;
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) {
                    geo.data.offset = val;
                    editor.drawBoard.saveState();
                }
            }
            editor.drawBoard.draw();
        });

        const currentLength = parseFloat(this.getRenderData()[0]?.text || 0);

        let distanceInput = editor.createNumberField("Length (mm)", currentLength, (val) => {
            if (this.constraintId) {
                let geo = editor.drawBoard.constraintSystem.geometries.get(this.constraintId);
                if (geo) geo.data.value = val;

                let found = false;
                for (let [cId, cDef] of editor.drawBoard.constraintSystem.constraints) {
                    if (cDef.geometryId === this.constraintId) {
                        cDef.value = val;
                        found = true;
                        break;
                    } else if (!cDef.geometryId && cDef.type === "LineCircleMeasurement") {
                        if (cDef.targets.includes(this.lineShape.constraintId) && cDef.targets.includes(this.circleShape.constraintId)) {
                            cDef.value = val;
                            cDef.geometryId = this.constraintId;
                            found = true;
                            break;
                        }
                    }
                }

                if (!found) {
                    editor.drawBoard.constraintSystem.addConstraint({
                        type: "LineCircleMeasurement",
                        targets: [this.lineShape.constraintId, this.circleShape.constraintId],
                        value: val,
                        geometryId: this.constraintId
                    });
                }

                // Trigger solver
                editor.drawBoard.constraintSystem.solveLocal(this.circleShape.constraintId);
            }

            editor.drawBoard.saveState();
            editor.drawBoard.draw();
            editor.render();
        });
        
        let alignBtn = document.createElement('button');
        alignBtn.innerText = "Align Tangent (Distance = 0)";
        alignBtn.style.marginTop = "5px";
        alignBtn.style.width = "100%";
        alignBtn.onclick = () => {
             distanceInput.querySelector('input').value = 0;
             distanceInput.querySelector('input').dispatchEvent(new Event('change'));
        };

        divArea.appendChild(distanceInput);
        divArea.appendChild(offsetInput);
        divArea.appendChild(alignBtn);
        editor.container.appendChild(divArea);
    }
}