import { BaseShape } from "./BaseShape.js";

export class GeometricTangentShape extends BaseShape {
    constructor(drawBoard, shape1, shape2) {
        super();
        this.color = "blue"; 
        this.drawBoard = drawBoard;
        this.s1 = shape1;
        this.s2 = shape2;
        this.type = "GeometricTangent";
        this.isConstraint = true;
    }

    getRenderData() {
        if (!this.s1 || !this.s2) return [];

        let type1 = this.s1.constructor.name;
        let type2 = this.s2.constructor.name;
        
        let lineShape = type1 === "DrawLine" ? this.s1 : (type2 === "DrawLine" ? this.s2 : null);
        let circShape = type1 === "DrawCircle" ? this.s1 : (type2 === "DrawCircle" ? this.s2 : null);

        let tanX = 0, tanY = 0;

        if (lineShape && circShape) {
            let center = circShape.center;
            let l1 = lineShape.startPoint.vec4;
            let l2 = lineShape.endpoint.vec4;

            let x0 = center.x, y0 = center.y;
            let x1 = l1.x, y1 = l1.y;
            let x2 = l2.x, y2 = l2.y;

            let num = (x2 - x1)*(y1 - y0) - (x1 - x0)*(y2 - y1);
            let den = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
            if (den > 0) {
                let t = ((x0 - x1)*(x2 - x1) + (y0 - y1)*(y2 - y1)) / den;
                tanX = x1 + t*(x2 - x1);
                tanY = y1 + t*(y2 - y1);
            } else {
                return [];
            }
        } else if (type1 === "DrawCircle" && type2 === "DrawCircle") {
            let c1 = this.s1.center;
            let c2 = this.s2.center;
            let r1 = this.s1.radius;
            let r2 = this.s2.radius;

            let dx = c2.x - c1.x;
            let dy = c2.y - c1.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 0) {
                tanX = c1.x + (dx / dist) * r1;
                tanY = c1.y + (dy / dist) * r1;
            } else {
                return [];
            }
        } else {
            return []; // Unhandled tangent pairing for symbols
        }

        // Draw a small distinct tangent symbol ('T' or a visual cross) at (tanX, tanY)
        const camScale = this.drawBoard.camera.getCalcMatrix()[0][0]; 
        const barSize = 6 / camScale;

        return [
            // Top bar of 'T'
            {
                primitive: 'line',
                worldStartX: tanX - barSize, worldStartY: tanY + barSize,
                worldEndX: tanX + barSize, worldEndY: tanY + barSize,
                color: "magenta",
                lineWidth: 2
            },
            // Vertical bar of 'T'
            {
                primitive: 'line',
                worldStartX: tanX, worldStartY: tanY + barSize,
                worldEndX: tanX, worldEndY: tanY - barSize,
                color: "magenta",
                lineWidth: 2
            }
        ];
    }

    buildProperties(editor) {
        let divArea = document.createElement('div');
        divArea.style.marginBottom = "10px";
        divArea.style.padding = "5px";
        divArea.style.border = "1px solid #eee";
        divArea.innerHTML = `<h4 style="margin:0 0 5px 0">Tangent Constraint</h4><p>Forces the geometries to be tangent.</p>`;

        let rmBtn = document.createElement('button');
        rmBtn.innerText = "Delete Constraint";
        rmBtn.style.marginTop = "5px";
        rmBtn.style.width = "100%";
        rmBtn.onclick = () => {
             if (this.constraintId) {
                 editor.drawBoard.constraintSystem.geometries.delete(this.constraintId);
                 
                 // remove active solver rule
                 for (let [cId, cDef] of editor.drawBoard.constraintSystem.constraints) {
                     if (cDef.geometryId === this.constraintId || (cDef.targets.includes(this.s1.constraintId) && cDef.targets.includes(this.s2.constraintId) && cDef.type === "Tangent")) {
                         editor.drawBoard.constraintSystem.constraints.delete(cId);
                     }
                 }
                 editor.drawBoard.constraintSystem.buildGraph();
             }
             
             let idx = editor.drawBoard.drawObjects.indexOf(this);
             if (idx > -1) {
                 editor.drawBoard.drawObjects.splice(idx, 1);
             }
             editor.drawBoard.needsUpdate = true;
             editor.drawBoard.selectedObjects = [];
             editor.drawBoard.saveState();
             editor.drawBoard.draw();
             editor.container.innerHTML = "";
        };

        divArea.appendChild(rmBtn);
        editor.container.appendChild(divArea);
    }
}