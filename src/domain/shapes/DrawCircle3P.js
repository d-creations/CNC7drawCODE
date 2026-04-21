import { BaseShape } from "./BaseShape.js";
import { DrawCircle } from "./DrawCircle.js";
import { Vec4 } from "../Camera.js";
import { Point } from "./Point.js";

export class DrawCircle3P extends BaseShape {
    p1; p2; p3;

    constructor(ctx, camera, p1, p2, p3) {
        super(ctx, camera);
        this.p1 = p1; this.p2 = p2; this.p3 = p3;
    }

    getCircumcenter() {
        // Uses geometric formula to find the circumcenter (intersection of perpendicular bisectors)
        let A = this.p1.vec4; let B = this.p2.vec4; let C = this.p3.vec4;
        
        let D = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
        if (Math.abs(D) < 0.0001) return { x: A.x, y: A.y, r: 0 }; // Collinear, return fake point

        let A_sq = A.x*A.x + A.y*A.y;
        let B_sq = B.x*B.x + B.y*B.y;
        let C_sq = C.x*C.x + C.y*C.y;

        let Ux = (A_sq * (B.y - C.y) + B_sq * (C.y - A.y) + C_sq * (A.y - B.y)) / D;
        let Uy = (A_sq * (C.x - B.x) + B_sq * (A.x - C.x) + C_sq * (B.x - A.x)) / D;

        let r = Math.sqrt(Math.pow(A.x - Ux, 2) + Math.pow(A.y - Uy, 2));
        
        return { x: Ux, y: Uy, r: r };
    }

    draw() {
        let circ = this.getCircumcenter();
        let centerCamVec = new Vec4(circ.x, circ.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        
        let scaledRadius = circ.r * this.camera.getCalcMatrix()[0][0];

        this.ctx.beginPath();
        this.ctx.arc(centerCamVec.x, centerCamVec.y, scaledRadius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();
    }

    check(x, y) {
        let circ = this.getCircumcenter();
        let centerCamVec = new Vec4(circ.x, circ.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        let scaledRadius = circ.r * this.camera.getCalcMatrix()[0][0];

        let distToTarget = Math.sqrt(Math.pow(x - centerCamVec.x, 2) + Math.pow(y - centerCamVec.y, 2));
        return Math.abs(distToTarget - scaledRadius);
    }

    buildProperties(editor) {
        editor.buildPointFields(this.p1, "Point 1");
        editor.buildPointFields(this.p2, "Point 2");
        editor.buildPointFields(this.p3, "Point 3");
        
        let circ = this.getCircumcenter();
        editor.createNumberField("Radius", circ.r, () => {}); // Read-only info
    }

    static create(drawBoard, pt1Params, pt2Params, pt3Params) {
        drawBoard.clearTempObjects();
        let p1 = Point.resolve(drawBoard, pt1Params, false);
        let p2 = Point.resolve(drawBoard, pt2Params, false);
        let p3 = Point.resolve(drawBoard, pt3Params, false);

        drawBoard.drawObjects.push(new DrawCircle3P(drawBoard.context, drawBoard.camera, p1, p2, p3));
        drawBoard.draw();
    }

    static createTempTrack(drawBoard, selectedPointsArray, currentMousePosObj) {
        drawBoard.clearTempObjects();
        
        let ptOBJs = [];
        for (let p of selectedPointsArray) {
            ptOBJs.push(Point.resolve(drawBoard, p, true));
        }

        let mouseObj = Point.resolve(drawBoard, currentMousePosObj, true);

        // Required import: DrawLine (need to resolve this dependency carefully or duplicate draw line logic briefly)
        // Leaving it to draw lines via context directly to avoid circular dependency
        drawBoard.context.beginPath();
        drawBoard.context.strokeStyle = "red";
        
        let cams = ptOBJs.map(p => p.vec4.mulMatrix(drawBoard.camera.getCalcMatrix()));
        let mCam = mouseObj.vec4.mulMatrix(drawBoard.camera.getCalcMatrix());

        if (ptOBJs.length === 1) {
            drawBoard.context.moveTo(cams[0].x, cams[0].y);
            drawBoard.context.lineTo(mCam.x, mCam.y);
            drawBoard.context.stroke();
        } 
        else if (ptOBJs.length === 2) {
            drawBoard.context.moveTo(cams[0].x, cams[0].y);
            drawBoard.context.lineTo(cams[1].x, cams[1].y);
            drawBoard.context.lineTo(mCam.x, mCam.y);
            drawBoard.context.lineTo(cams[0].x, cams[0].y);
            drawBoard.context.stroke();
            
            drawBoard.drawTempObjects.push(new DrawCircle3P(drawBoard.context, drawBoard.camera, ptOBJs[0], ptOBJs[1], mouseObj));
        }
        
        drawBoard.draw();
    }
}
