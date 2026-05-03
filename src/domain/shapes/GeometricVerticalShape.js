import { BaseShape } from "./BaseShape.js";

export class GeometricVerticalShape extends BaseShape {
    constructor(drawBoard, point1, point2) {
        super();
        this.color = "blue"; 
        this.drawBoard = drawBoard;
        this.p1 = point1;
        this.p2 = point2;
        this.type = "GeometricVertical";
        this.isConstraint = true;
    }

    getRenderData() {
        if (!this.p1 || !this.p2) return [];
        // Calculate midpoint
        const midX = (this.p1.x + this.p2.x) / 2;
        const midY = (this.p1.y + this.p2.y) / 2;
        
        // Short vertical blue bar centered at the midpoint
        const barLength = 10;
        const camScale = this.drawBoard.camera.getCalcMatrix()[0][0]; 
        const worldBarLength = barLength / camScale;
        
        return [{
            primitive: 'line',
            worldStartX: midX,
            worldStartY: midY - worldBarLength,
            worldEndX: midX,
            worldEndY: midY + worldBarLength,
            color: this.color,
            lineWidth: 2
        }];
    }

    buildProperties(editor) {
        let divArea = document.createElement('div');
        divArea.style.marginBottom = "10px";
        divArea.style.padding = "5px";
        divArea.style.border = "1px solid #eee";
        divArea.innerHTML = `<h4 style="margin:0 0 5px 0">Vertical Constraint</h4><p>Forces the selected points to share the same X axis.</p>`;

        let rmBtn = document.createElement('button');
        rmBtn.innerText = "Delete Constraint";
        rmBtn.style.marginTop = "5px";
        rmBtn.style.width = "100%";
        rmBtn.onclick = () => {
             // Removing constraint workflow
             if (this.constraintId) {
                 editor.drawBoard.constraintSystem.geometries.delete(this.constraintId);
                 
                 // remove active solver rule
                 for (let [cId, cDef] of editor.drawBoard.constraintSystem.constraints) {
                     if (cDef.geometryId === this.constraintId || (cDef.targets.includes(this.p1.constraintId) && cDef.targets.includes(this.p2.constraintId) && cDef.type === "Vertical")) {
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