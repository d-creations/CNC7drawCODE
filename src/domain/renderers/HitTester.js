import { Vec4 } from "../Camera.js";

export class HitTester {
    static hitTest(displayList, screenX, screenY, camera) {
        let minDist = Infinity;
        
        for (const instruction of displayList) {
            let dist = Infinity;
            if (instruction.primitive === 'line') {
                dist = HitTester.distToLine(instruction, screenX, screenY, camera);
            } else if (instruction.primitive === 'arc') {
                dist = HitTester.distToArc(instruction, screenX, screenY, camera);
            } else if (instruction.primitive === 'dimension_length') {
                dist = HitTester.distToDimensionLength(instruction, screenX, screenY, camera);
            } else if (instruction.primitive === 'dimension_horizontal') {
                dist = HitTester.distToDimensionHorizontal(instruction, screenX, screenY, camera);
            } else if (instruction.primitive === 'dimension_vertical') {
                dist = HitTester.distToDimensionVertical(instruction, screenX, screenY, camera);
            } else if (instruction.primitive === 'dimension_radius') {
                dist = HitTester.distToDimensionRadius(instruction, screenX, screenY, camera);
            } else if (instruction.primitive === 'dimension_angle') {
                dist = HitTester.distToDimensionAngle(instruction, screenX, screenY, camera);
            }

            if (dist < minDist) {
                minDist = dist;
            }
        }
        return minDist;
    }

    static checkInsideArea(displayList, minX, minY, maxX, maxY, requireComplete, camera) {
        for (const instruction of displayList) {
            let hit = false;
            if (instruction.primitive === 'line') {
                hit = HitTester.areaLine(instruction, minX, minY, maxX, maxY, requireComplete, camera);
            } else if (instruction.primitive === 'arc') {
                hit = HitTester.areaArc(instruction, minX, minY, maxX, maxY, requireComplete, camera);
            }
            // dimensions aren't selectable via area dragging usually
            
            if (!requireComplete && hit) return true;
            if (requireComplete && !hit) return false; // fast fail
        }
        return requireComplete ? displayList.length > 0 : false;
    }

    static distToLine(instruction, x, y, camera) {
        let startCam = new Vec4(instruction.worldStartX, instruction.worldStartY, 0, 1).mulMatrix(camera.getCalcMatrix());
        let endCam = new Vec4(instruction.worldEndX, instruction.worldEndY, 0, 1).mulMatrix(camera.getCalcMatrix());
        let dx = endCam.x - startCam.x;
        let dy = endCam.y - startCam.y;
        let len2 = dx * dx + dy * dy;
        if (len2 === 0) return Math.sqrt(Math.pow(x - startCam.x, 2) + Math.pow(y - startCam.y, 2));

        let t = ((x - startCam.x) * dx + (y - startCam.y) * dy) / len2;
        t = Math.max(0, Math.min(1, t));

        let closestX = startCam.x + t * dx;
        let closestY = startCam.y + t * dy;

        return Math.sqrt(Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2));
    }

    static areaLine(instruction, minX, minY, maxX, maxY, requireComplete, camera) {
        let startCam = new Vec4(instruction.worldStartX, instruction.worldStartY, 0, 1).mulMatrix(camera.getCalcMatrix());
        let endCam = new Vec4(instruction.worldEndX, instruction.worldEndY, 0, 1).mulMatrix(camera.getCalcMatrix());
        
        let isInside = (px, py) => px >= minX && px <= maxX && py >= minY && py <= maxY;
        let startIn = isInside(startCam.x, startCam.y);
        let endIn = isInside(endCam.x, endCam.y);

        if (requireComplete) return startIn && endIn;
        if (startIn || endIn) return true;
        
        let lineIntersects = (x1, y1, x2, y2, x3, y3, x4, y4) => {
            let numA = (x4-x3)*(y1-y3) - (y4-y3)*(x1-x3);
            let numB = (x2-x1)*(y1-y3) - (y2-y1)*(x1-x3);
            let den = (y4-y3)*(x2-x1) - (x4-x3)*(y2-y1);
            if (den === 0) return false;
            let uA = numA / den;
            let uB = numB / den;
            return (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1);
        };

        if (lineIntersects(startCam.x, startCam.y, endCam.x, endCam.y, minX, minY, maxX, minY)) return true;
        if (lineIntersects(startCam.x, startCam.y, endCam.x, endCam.y, minX, maxY, maxX, maxY)) return true;
        if (lineIntersects(startCam.x, startCam.y, endCam.x, endCam.y, minX, minY, minX, maxY)) return true;
        if (lineIntersects(startCam.x, startCam.y, endCam.x, endCam.y, maxX, minY, maxX, maxY)) return true;
        return false;
    }

    static distToArc(instruction, x, y, camera) {
        let centerCam = new Vec4(instruction.worldX, instruction.worldY, 0, 1).mulMatrix(camera.getCalcMatrix());
        let radius = 0;
        if (instruction.worldRadius !== undefined) {
            let cameraScale = camera.getCalcMatrix()[0][0];
            radius = instruction.worldRadius * cameraScale;
        } else if (instruction.radius !== undefined) {
            radius = instruction.radius; // Screen space radius (e.g. Point)
        }

        let distToCenter = Math.sqrt(Math.pow(x - centerCam.x, 2) + Math.pow(y - centerCam.y, 2));

        if (instruction.fill && radius > 0) {
            // For a filled point or circle, distance from center is good enough because anything < radius is a hit
            return distToCenter;
        }

        if (instruction.startAngle === undefined && instruction.endAngle === undefined) {
            // Full circle empty
            return Math.abs(distToCenter - radius);
        }

        let angle = Math.atan2(y - centerCam.y, x - centerCam.x);
        if (angle < 0) angle += 2 * Math.PI;

        let start = instruction.startAngle !== undefined ? instruction.startAngle : 0;
        let end = instruction.endAngle !== undefined ? instruction.endAngle : 2 * Math.PI;
        
        let inSector = false;
        if (start < end) {
            inSector = angle >= start && angle <= end;
        } else {
            inSector = angle >= start || angle <= end;
        }

        if (!inSector) return Infinity;
        return Math.abs(distToCenter - radius);
    }

    static areaArc(instruction, minX, minY, maxX, maxY, requireComplete, camera) {
        let centerCam = new Vec4(instruction.worldX, instruction.worldY, 0, 1).mulMatrix(camera.getCalcMatrix());
        let cx = centerCam.x;
        let cy = centerCam.y;
        let radius = 0;
        if (instruction.worldRadius !== undefined) radius = instruction.worldRadius * camera.getCalcMatrix()[0][0];
        else if (instruction.radius !== undefined) radius = instruction.radius;
        
        if (requireComplete) {
            return cx - radius >= minX && cx + radius <= maxX && 
                   cy - radius >= minY && cy + radius <= maxY;
        } else {
            if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) return true;
            let closestX = Math.max(minX, Math.min(cx, maxX));
            let closestY = Math.max(minY, Math.min(cy, maxY));
            return (Math.pow(cx - closestX, 2) + Math.pow(cy - closestY, 2)) <= (radius * radius);
        }
    }

    static distToDimensionLength(instruction, x, y, camera) {
        const v1 = new Vec4(instruction.worldP1.x, instruction.worldP1.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const v2 = new Vec4(instruction.worldP2.x, instruction.worldP2.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        const screenLen = Math.sqrt(dx * dx + dy * dy);
        if (screenLen < 1) return Infinity;

        const ang = Math.atan2(dy, dx);
        const nx = -Math.sin(ang);
        const ny = Math.cos(ang);
        
        const offset = instruction.offset || 20;
        const ex1 = v1.x + nx * offset;
        const ey1 = v1.y + ny * offset;
        const ex2 = v2.x + nx * offset;
        const ey2 = v2.y + ny * offset;

        let num = Math.abs((ex2 - ex1) * (ey1 - y) - (ex1 - x) * (ey2 - ey1));
        let d = num / screenLen;

        let dotProduct = ((x - ex1) * (ex2 - ex1) + (y - ey1) * (ey2 - ey1)) / screenLen;
        if (dotProduct < -20 || dotProduct > screenLen + 20) return Infinity;
        return d;
    }

    static distToDimensionHorizontal(instruction, x, y, camera) {
        const v1 = new Vec4(instruction.worldP1.x, instruction.worldP1.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const v2 = new Vec4(instruction.worldP2.x, instruction.worldP2.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const leftP = v1.x < v2.x ? v1 : v2;
        const rightP = v1.x < v2.x ? v2 : v1;
        const screenLen = rightP.x - leftP.x;
        if (screenLen < 1) return Infinity;

        // Renderer places the horizontal dimension at the middle Y (baseY) + offset
        const offset = instruction.offset || 20;
        const baseY = (v1.y + v2.y) / 2;
        const ey = baseY + offset;
        const ex1 = leftP.x;
        const ey1 = ey;
        const ex2 = rightP.x;
        const ey2 = ey; // horizontal constraint implies y remains constant on the dimension line visual

        let num = Math.abs((ex2 - ex1) * (ey1 - y) - (ex1 - x) * (ey2 - ey1));
        let d = num / screenLen;

        let dotProduct = ((x - ex1) * (ex2 - ex1) + (y - ey1) * (ey2 - ey1)) / screenLen;
        if (dotProduct < -20 || dotProduct > screenLen + 20) return Infinity;
        return d;
    }

    static distToDimensionVertical(instruction, x, y, camera) {
        const v1 = new Vec4(instruction.worldP1.x, instruction.worldP1.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const v2 = new Vec4(instruction.worldP2.x, instruction.worldP2.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const topP = v1.y < v2.y ? v1 : v2;
        const bottomP = v1.y < v2.y ? v2 : v1;
        const screenLen = bottomP.y - topP.y;
        if (screenLen < 1) return Infinity;

        // Renderer places the vertical dimension at the middle X (baseX) + offset
        const offset = instruction.offset || 20;
        const baseX = (v1.x + v2.x) / 2;
        const ex = baseX + offset;
        const ex1 = ex;
        const ey1 = topP.y;
        const ex2 = ex;
        const ey2 = bottomP.y;

        let num = Math.abs((ex2 - ex1) * (ey1 - y) - (ex1 - x) * (ey2 - ey1));
        let d = num / screenLen;

        let dotProduct = ((x - ex1) * (ex2 - ex1) + (y - ey1) * (ey2 - ey1)) / screenLen;
        if (dotProduct < -20 || dotProduct > screenLen + 20) return Infinity;
        return d;
    }

    static distToDimensionRadius(instruction, x, y, camera) {
        const vC = new Vec4(instruction.worldCenter.x, instruction.worldCenter.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const scaledRadius = instruction.worldRadius * camera.getCalcMatrix()[0][0];
        
        let screenAng = -instruction.angle;
        let lx, ly;

        if (instruction.textAnchor) {
            let anchorCam = new Vec4(instruction.textAnchor.x, instruction.textAnchor.y, 0, 1).mulMatrix(camera.getCalcMatrix());
            lx = anchorCam.x;
            ly = anchorCam.y;
            let dx = lx - vC.x;
            let dy = ly - vC.y;
            screenAng = Math.atan2(dy, dx);
        } else {
            const extLen = 20;
            lx = vC.x + Math.cos(screenAng) * (scaledRadius + extLen);
            ly = vC.y + Math.sin(screenAng) * (scaledRadius + extLen);
        }

        const sx = vC.x + Math.cos(screenAng) * scaledRadius;
        const sy = vC.y + Math.sin(screenAng) * scaledRadius;
        
        let num = Math.abs((lx - vC.x) * (vC.y - y) - (vC.x - x) * (ly - vC.y));
        let chunkLen = Math.sqrt(Math.pow(lx - vC.x, 2) + Math.pow(ly - vC.y, 2));
        if (chunkLen < 1) return Infinity;
        let d = num / chunkLen;

        let dotProduct = ((x - vC.x) * (lx - vC.x) + (y - vC.y) * (ly - vC.y)) / chunkLen;
        if (dotProduct < -20 || dotProduct > chunkLen + 20) return Infinity;
        return d;
    }

    static distToDimensionAngle(instruction, x, y, camera) {
        const intersection = new Vec4(instruction.worldIntersection.x, instruction.worldIntersection.y, 0, 1).mulMatrix(camera.getCalcMatrix());
        const radius = instruction.radius || 40;
        
        if (instruction.textAnchor) {
            let anchorCam = new Vec4(instruction.textAnchor.x, instruction.textAnchor.y, 0, 1).mulMatrix(camera.getCalcMatrix());
            let distToText = Math.sqrt(Math.pow(x - anchorCam.x, 2) + Math.pow(y - anchorCam.y, 2));
            if (distToText < 20) return distToText; // Allow selecting by clicking the dragged text anchor
        }
        
        const distToCenter = Math.sqrt(Math.pow(x - intersection.x, 2) + Math.pow(y - intersection.y, 2));
        
        let angle = Math.atan2(y - intersection.y, x - intersection.x);
        if (angle < 0) angle += 2 * Math.PI;

        const startAng = instruction.a1;
        const endAng = instruction.a2;

        let inSector = false;
        if (startAng < endAng) {
            inSector = angle >= startAng && angle <= endAng;
        } else {
            inSector = angle >= startAng || angle <= endAng;
        }

        if (!inSector) return Infinity;
        return Math.abs(distToCenter - radius);
    }
}
