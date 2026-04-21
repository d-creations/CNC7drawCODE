import { BaseShape } from "./BaseShape.js";
import { Vec4 } from "../Camera.js";
import { Point } from "./Point.js";
import { Geometry } from "../math/Geometry.js";

export class DrawCircle2T1R extends BaseShape {
    l1; l2; 
    hintPoint;
    radius;

    constructor(ctx, camera, l1, l2, hintPointObj, radius) {
        super(ctx, camera);
        this.l1 = l1; 
        this.l2 = l2; 
        this.hintPoint = hintPointObj; 
        this.radius = radius;
        
        let circ = this.getIncircle();
        let pt1Vec = Geometry.getTangentPoint(circ, this.l1);
        let pt2Vec = Geometry.getTangentPoint(circ, this.l2);
        
        this.tPoint1 = new Point(this.ctx, this.camera, new Vec4(pt1Vec.x, pt1Vec.y, 0, 1));
        this.tPoint2 = new Point(this.ctx, this.camera, new Vec4(pt2Vec.x, pt2Vec.y, 0, 1));
    }

    getIncircle() {
        return Geometry.getCircleCenter2T1R(this.l1, this.l2, this.radius, this.hintPoint.vec4);
    }

    updateTangentPoints() {
        let circ = this.getIncircle();
        if (circ.r === 0) return;

        let pt1Vec = Geometry.getTangentPoint(circ, this.l1);
        let pt2Vec = Geometry.getTangentPoint(circ, this.l2);
        
        if (pt1Vec) { this.tPoint1.vec4.x = pt1Vec.x; this.tPoint1.vec4.y = pt1Vec.y; }
        if (pt2Vec) { this.tPoint2.vec4.x = pt2Vec.x; this.tPoint2.vec4.y = pt2Vec.y; }
    }

    draw() {
        this.updateTangentPoints();
        
        let circ = this.getIncircle();
        if (circ.r === 0) return; // Overlapping/Parallel error

        let centerCamVec = new Vec4(circ.x, circ.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        let scaledRadius = circ.r * this.camera.getCalcMatrix()[0][0];

        this.ctx.beginPath();
        this.ctx.arc(centerCamVec.x, centerCamVec.y, scaledRadius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();

        this.tPoint1.color = "blue";
        this.tPoint2.color = "blue";
        this.tPoint1.draw();
        this.tPoint2.draw();
    }

    check(x, y) {
        let circ = this.getIncircle();
        if (circ.r === 0) return 99999;

        let centerCamVec = new Vec4(circ.x, circ.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        let scaledRadius = circ.r * this.camera.getCalcMatrix()[0][0];

        let distToTarget = Math.sqrt(Math.pow(x - centerCamVec.x, 2) + Math.pow(y - centerCamVec.y, 2));
        return Math.abs(distToTarget - scaledRadius);
    }

    buildProperties(editor) {
        let circ = this.getIncircle();
        
        let infoDiv = document.createElement('div');
        infoDiv.innerHTML = "<b>Constrained to 2 Lines</b>";
        infoDiv.style.marginBottom = "10px";
        editor.container.appendChild(infoDiv);

        editor.createNumberField("Radius", this.radius, (val) => {
            this.radius = val;
            editor.drawBoard.draw();
        }); 

        let centerInfo = document.createElement('div');
        centerInfo.innerHTML = `<i>Calculated Center: X: ${circ.x.toFixed(2)}, Y: ${circ.y.toFixed(2)}</i>`;
        centerInfo.style.marginTop = "10px";
        centerInfo.style.fontSize = "12px";
        editor.container.appendChild(centerInfo);
        
        editor.buildPointFields(this.hintPoint, "Quadrant Hint Target");
    }

    getSubObjects() {
        return [this.tPoint1, this.tPoint2];
    }

    static create(drawBoard, line1, line2, hintPointParam, explicitRadius) {
        // Resolve the hint point without caching it as a permanent Canvas Object if it didn't exist
        let hintObj;
        if (hintPointParam.exist) {
            hintObj = hintPointParam.obj;
        } else {
            let vec = drawBoard.camera.getWorldVec(hintPointParam.x, hintPointParam.y);
            hintObj = new Point(drawBoard.context, drawBoard.camera, vec); // Virtual temporary point
        }
        
        let calculatedRadius = explicitRadius > 0 ? explicitRadius : Geometry.pointToLineDistance(hintObj.vec4, line1);

        drawBoard.drawObjects.push(new DrawCircle2T1R(drawBoard.context, drawBoard.camera, line1, line2, hintObj, calculatedRadius));
        line1.changeColor("red");
        line2.changeColor("red");
        drawBoard.draw();
    }
}