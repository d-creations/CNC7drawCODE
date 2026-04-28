const fs = require("fs");

let renderer = fs.readFileSync("./src/domain/renderers/CanvasRenderer.js", "utf8");

const newMethods = `
    renderDimensionHorizontal(instruction) {
        let v1 = new Vec4(instruction.worldP1.x, instruction.worldP1.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        let v2 = new Vec4(instruction.worldP2.x, instruction.worldP2.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());

        const dx = v2.x - v1.x;
        const screenLen = Math.abs(dx);
        if (screenLen < 1) return;

        const ang = dx >= 0 ? 0 : Math.PI;
        
        const baseY = (v1.y + v2.y) / 2;
        const ey = baseY + instruction.offset;

        const ex1 = v1.x;
        const ex2 = v2.x;

        this.ctx.save();
        this.ctx.strokeStyle = instruction.color || "purple";
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        this.ctx.moveTo(v1.x, v1.y);
        this.ctx.lineTo(ex1, ey);
        this.ctx.moveTo(v2.x, v2.y);
        this.ctx.lineTo(ex2, ey);
        
        this.ctx.moveTo(ex1, ey);
        this.ctx.lineTo(ex2, ey);

        const arrowSize = 10;
        const arrowAng = Math.PI / 6;
        
        const a1x = ex1 + Math.cos(ang - arrowAng) * arrowSize;
        const a1y = ey + Math.sin(ang - arrowAng) * arrowSize;
        const a2x = ex1 + Math.cos(ang + arrowAng) * arrowSize;
        const a2y = ey + Math.sin(ang + arrowAng) * arrowSize;

        const b1x = ex2 - Math.cos(ang - arrowAng) * arrowSize;
        const b1y = ey - Math.sin(ang - arrowAng) * arrowSize;
        const b2x = ex2 - Math.cos(ang + arrowAng) * arrowSize;
        const b2y = ey - Math.sin(ang + arrowAng) * arrowSize;

        this.ctx.moveTo(ex1, ey);
        this.ctx.lineTo(a1x, a1y);
        this.ctx.moveTo(ex1, ey);
        this.ctx.lineTo(a2x, a2y);

        this.ctx.moveTo(ex2, ey);
        this.ctx.lineTo(b1x, b1y);
        this.ctx.moveTo(ex2, ey);
        this.ctx.lineTo(b2x, b2y);

        this.ctx.stroke();

        const midX = (ex1 + ex2) / 2;
        const midY = ey;

        this.ctx.translate(midX, midY);
        
        const charSize = 8;
        const textWidth = instruction.text.length * charSize * 1.5;
        this.drawStickText(instruction.text, -textWidth / 2, -charSize - 2, charSize, instruction.color || "purple");

        this.ctx.restore();
    }

    renderDimensionVertical(instruction) {
        let v1 = new Vec4(instruction.worldP1.x, instruction.worldP1.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        let v2 = new Vec4(instruction.worldP2.x, instruction.worldP2.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());

        const dy = v2.y - v1.y;
        const screenLen = Math.abs(dy);
        if (screenLen < 1) return;

        const ang = dy >= 0 ? Math.PI/2 : -Math.PI/2;
        
        const baseX = (v1.x + v2.x) / 2;
        const ex = baseX + instruction.offset;

        const ey1 = v1.y;
        const ey2 = v2.y;

        this.ctx.save();
        this.ctx.strokeStyle = instruction.color || "purple";
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        this.ctx.moveTo(v1.x, v1.y);
        this.ctx.lineTo(ex, ey1);
        this.ctx.moveTo(v2.x, v2.y);
        this.ctx.lineTo(ex, ey2);
        
        this.ctx.moveTo(ex, ey1);
        this.ctx.lineTo(ex, ey2);

        const arrowSize = 10;
        const arrowAng = Math.PI / 6;
        
        const a1x = ex + Math.cos(ang - arrowAng) * arrowSize;
        const a1y = ey1 + Math.sin(ang - arrowAng) * arrowSize;
        const a2x = ex + Math.cos(ang + arrowAng) * arrowSize;
        const a2y = ey1 + Math.sin(ang + arrowAng) * arrowSize;

        const b1x = ex - Math.cos(ang - arrowAng) * arrowSize;
        const b1y = ey2 - Math.sin(ang - arrowAng) * arrowSize;
        const b2x = ex - Math.cos(ang + arrowAng) * arrowSize;
        const b2y = ey2 - Math.sin(ang + arrowAng) * arrowSize;

        this.ctx.moveTo(ex, ey1);
        this.ctx.lineTo(a1x, a1y);
        this.ctx.moveTo(ex, ey1);
        this.ctx.lineTo(a2x, a2y);

        this.ctx.moveTo(ex, ey2);
        this.ctx.lineTo(b1x, b1y);
        this.ctx.moveTo(ex, ey2);
        this.ctx.lineTo(b2x, b2y);

        this.ctx.stroke();

        const midX = ex;
        const midY = (ey1 + ey2) / 2;

        this.ctx.translate(midX, midY);
        this.ctx.rotate(-Math.PI / 2);
        
        const charSize = 8;
        const textWidth = instruction.text.length * charSize * 1.5;
        this.drawStickText(instruction.text, -textWidth / 2, -charSize - 2, charSize, instruction.color || "purple");

        this.ctx.restore();
    }

    renderDimensionRadius(instruction) {
        const scale = this.camera.getCalcMatrix()[0][0];
        let centerCam = new Vec4(instruction.worldCenter.x, instruction.worldCenter.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());
        const scaledRadius = instruction.worldRadius * scale;

        this.ctx.save();
        this.ctx.strokeStyle = instruction.color || "purple";
        this.ctx.lineWidth = 1;

        const screenAng = -instruction.angle; 
        const sx = centerCam.x + Math.cos(screenAng) * scaledRadius;
        const sy = centerCam.y + Math.sin(screenAng) * scaledRadius;

        this.ctx.beginPath();
        this.ctx.moveTo(centerCam.x, centerCam.y);
        
        const extLen = 20;
        const lx = centerCam.x + Math.cos(screenAng) * (scaledRadius + extLen);
        const ly = centerCam.y + Math.sin(screenAng) * (scaledRadius + extLen);
        
        this.ctx.lineTo(lx, ly);

        const arrowSize = 10;
        const arrowAng = Math.PI / 6;
        
        const a1x = sx - Math.cos(screenAng - arrowAng) * arrowSize;
        const a1y = sy - Math.sin(screenAng - arrowAng) * arrowSize;
        const a2x = sx - Math.cos(screenAng + arrowAng) * arrowSize;
        const a2y = sy - Math.sin(screenAng + arrowAng) * arrowSize;

        this.ctx.moveTo(a1x, a1y);
        this.ctx.lineTo(sx, sy);
        this.ctx.lineTo(a2x, a2y);

        this.ctx.stroke();

        this.ctx.translate(lx, ly);
        
        const charSize = 8;
        this.drawStickText(instruction.text, 5, -charSize/2, charSize, instruction.color || "purple");

        this.ctx.restore();
    }

    renderDimensionAngle(instruction) {
        let interScr = new Vec4(instruction.worldIntersection.x, instruction.worldIntersection.y, 0, 1).mulMatrix(this.camera.getCalcMatrix());

        this.ctx.save();
        this.ctx.strokeStyle = instruction.color || "purple";
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        this.ctx.arc(interScr.x, interScr.y, instruction.radius, instruction.a1, instruction.a2);
        this.ctx.stroke();

        const textX = interScr.x + Math.cos(instruction.midAng) * (instruction.radius + 15);
        const textY = interScr.y + Math.sin(instruction.midAng) * (instruction.radius + 15);

        const charSize = 8;
        const textWidth = instruction.text.length * charSize * 1.5;
        this.drawStickText(instruction.text, textX - textWidth/2, textY, charSize, instruction.color || "purple");

        this.ctx.restore();
    }
`;

const insertPos = renderer.lastIndexOf("drawStickText(");
const insertRealIndex = renderer.lastIndexOf("}", insertPos - 1) + 1; // get right before drawStickText

renderer = renderer.slice(0, insertRealIndex) + newMethods + renderer.slice(insertRealIndex);

fs.writeFileSync("./src/domain/renderers/CanvasRenderer.js", renderer);
console.log("CanvasRenderer patched.");

const batchPatchShapes = () => {
    // 1. Horizontal
    let hms = fs.readFileSync("./src/domain/shapes/HorizontalMeasurementShape.js", "utf8");
    hms = hms.replace(/draw\(\)\s*{[\s\S]*?(?=check\()/, "getRenderData() {\n" +
        "        if (!this.p1 || !this.p2) return [];\n" +
        "        const w_dx = Math.abs(this.p2.x - this.p1.x);\n" +
        "        return [{\n" +
        "            primitive: 'dimension_horizontal',\n" +
        "            worldP1: { x: this.p1.x, y: this.p1.y },\n" +
        "            worldP2: { x: this.p2.x, y: this.p2.y },\n" +
        "            offset: this.offset,\n" +
        "            text: w_dx.toFixed(2),\n" +
        "            color: this.color\n" +
        "        }];\n" +
        "    }\n\n    ");
    fs.writeFileSync("./src/domain/shapes/HorizontalMeasurementShape.js", hms);

    // 2. Vertical
    let vms = fs.readFileSync("./src/domain/shapes/VerticalMeasurementShape.js", "utf8");
    vms = vms.replace(/draw\(\)\s*{[\s\S]*?(?=check\()/, "getRenderData() {\n" +
        "        if (!this.p1 || !this.p2) return [];\n" +
        "        const w_dy = Math.abs(this.p2.y - this.p1.y);\n" +
        "        return [{\n" +
        "            primitive: 'dimension_vertical',\n" +
        "            worldP1: { x: this.p1.x, y: this.p1.y },\n" +
        "            worldP2: { x: this.p2.x, y: this.p2.y },\n" +
        "            offset: this.offset,\n" +
        "            text: w_dy.toFixed(2),\n" +
        "            color: this.color\n" +
        "        }];\n" +
        "    }\n\n    ");
    fs.writeFileSync("./src/domain/shapes/VerticalMeasurementShape.js", vms);

    // 3. Radius
    let rms = fs.readFileSync("./src/domain/shapes/RadiusMeasurementShape.js", "utf8");
    rms = rms.replace(/draw\(\)\s*{[\s\S]*?(?=check\()/, "getRenderData() {\n" +
        "        if (!this.circle || !this.circle.centerPoint) return [];\n" +
        "        return [{\n" +
        "            primitive: 'dimension_radius',\n" +
        "            worldCenter: { x: this.circle.centerPoint.vec4.x, y: this.circle.centerPoint.vec4.y },\n" +
        "            worldRadius: this.circle.radius,\n" +
        "            angle: this.angle,\n" +
        "            text: 'R' + this.circle.radius.toFixed(2),\n" +
        "            color: this.color\n" +
        "        }];\n" +
        "    }\n\n    ");
    fs.writeFileSync("./src/domain/shapes/RadiusMeasurementShape.js", rms);

    // 4. Angle - geometry calculation moved to shape side which is perfect!
    let ams = fs.readFileSync("./src/domain/shapes/AngleMeasurementShape.js", "utf8");
    ams = ams.replace(/draw\(\)\s*{[\s\S]*?(?=check\()/, "getRenderData() {\n" +
        "        if (!this.l1 || !this.l2) return [];\n" +
        "        const intersection = Geometry.lineIntersection(this.l1, this.l2);\n" +
        "        if (!intersection) return [];\n" +
        "        \n" +
        "        let a1 = Math.atan2(this.l1.endpoint.vec4.y - this.l1.startPoint.vec4.y, this.l1.endpoint.vec4.x - this.l1.startPoint.vec4.x);\n" +
        "        let a2 = Math.atan2(this.l2.endpoint.vec4.y - this.l2.startPoint.vec4.y, this.l2.endpoint.vec4.x - this.l2.startPoint.vec4.x);\n" +
        "        \n" +
        "        let angle = Math.abs(a2 - a1);\n" +
        "        if (angle > Math.PI) angle = 2 * Math.PI - angle;\n" +
        "        const deg = (angle * 180 / Math.PI).toFixed(1);\n" +
        "        const textToDraw = deg + ' deg';\n" +
        "        const midAng = (a1 + a2) / 2;\n" +
        "\n" +
        "        return [{\n" +
        "            primitive: 'dimension_angle',\n" +
        "            worldIntersection: { x: intersection.x, y: intersection.y },\n" +
        "            radius: this.radius,\n" +
        "            a1: Math.min(a1, a2),\n" +
        "            a2: Math.max(a1, a2),\n" +
        "            midAng: midAng,\n" +
        "            text: textToDraw,\n" +
        "            color: this.color\n" +
        "        }];\n" +
        "    }\n\n    ");
    fs.writeFileSync("./src/domain/shapes/AngleMeasurementShape.js", ams);
}

batchPatchShapes();
