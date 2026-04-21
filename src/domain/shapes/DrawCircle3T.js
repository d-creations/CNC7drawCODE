import { BaseShape } from "./BaseShape.js";
import { Vec4 } from "../Camera.js";
import { Geometry } from "../math/Geometry.js";

export class DrawCircle3T extends BaseShape {
    l1; l2; l3;

    constructor(ctx, camera, l1, l2, l3) {
        super(ctx, camera);
        this.l1 = l1; this.l2 = l2; this.l3 = l3;

        let circ = this.getIncircle();
        let pt1Vec = Geometry.getTangentPoint(circ, this.l1) || {x:0, y:0};
        let pt2Vec = Geometry.getTangentPoint(circ, this.l2) || {x:0, y:0};
        let pt3Vec = Geometry.getTangentPoint(circ, this.l3) || {x:0, y:0};

        this.tPoint1 = new Point(this.ctx, this.camera, new Vec4(pt1Vec.x, pt1Vec.y, 0, 1));
        this.tPoint2 = new Point(this.ctx, this.camera, new Vec4(pt2Vec.x, pt2Vec.y, 0, 1));
        this.tPoint3 = new Point(this.ctx, this.camera, new Vec4(pt3Vec.x, pt3Vec.y, 0, 1));
    }

    getIncircle() {
        return Geometry.getCircleCenter3T(this.l1, this.l2, this.l3);
    }

    updateTangentPoints() {
        let circ = this.getIncircle();
        if (circ.r === 0) return;

        let pt1Vec = Geometry.getTangentPoint(circ, this.l1);
        let pt2Vec = Geometry.getTangentPoint(circ, this.l2);
        let pt3Vec = Geometry.getTangentPoint(circ, this.l3);
        
        if(pt1Vec) { this.tPoint1.vec4.x = pt1Vec.x; this.tPoint1.vec4.y = pt1Vec.y; }
        if(pt2Vec) { this.tPoint2.vec4.x = pt2Vec.x; this.tPoint2.vec4.y = pt2Vec.y; }
        if(pt3Vec) { this.tPoint3.vec4.x = pt3Vec.x; this.tPoint3.vec4.y = pt3Vec.y; }
    }

    draw() {
        this.updateTangentPoints();

        let circ = this.getIncircle();
        if (circ.r === 0) return; // Cannot draw if lines are parallel

        let centerCamVec = new Vec4(circ.x, circ.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        let scaledRadius = circ.r * this.camera.getCalcMatrix()[0][0];

        this.ctx.beginPath();
        this.ctx.arc(centerCamVec.x, centerCamVec.y, scaledRadius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();

        this.tPoint1.color = "blue";
        this.tPoint2.color = "blue";
        this.tPoint3.color = "blue";
        this.tPoint1.draw();
        this.tPoint2.draw();
        this.tPoint3.draw();
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
        infoDiv.innerHTML = "<b>Constrained to 3 Lines</b>";
        infoDiv.style.marginBottom = "10px";
        editor.container.appendChild(infoDiv);

        editor.createNumberField("Radius", circ.r, () => {}); // Read-only info
        editor.createNumberField("Center X", circ.x, () => {}); 
        editor.createNumberField("Center Y", circ.y, () => {}); 
    }

    getSubObjects() {
        return [this.tPoint1, this.tPoint2, this.tPoint3];
    }

    static create(drawBoard, line1, line2, line3) {
        drawBoard.drawObjects.push(new DrawCircle3T(drawBoard.context, drawBoard.camera, line1, line2, line3));
        line1.changeColor("red");
        line2.changeColor("red");
        line3.changeColor("red");
        drawBoard.draw();
    }
}
