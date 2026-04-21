export class Geometry {
    /**
     * Calculates Euclidean distance between two 2D points
     */
    static distance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    /**
     * Finds the intersection point of two infinite lines.
     * Returns null if lines are parallel.
     */
    static lineIntersection(lineA, lineB) {
        let x1 = lineA.startPoint.vec4.x;
        let y1 = lineA.startPoint.vec4.y;
        let x2 = lineA.endpoint.vec4.x;
        let y2 = lineA.endpoint.vec4.y;

        let x3 = lineB.startPoint.vec4.x;
        let y3 = lineB.startPoint.vec4.y;
        let x4 = lineB.endpoint.vec4.x;
        let y4 = lineB.endpoint.vec4.y;

        let denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 0.0001) return null; // Lines are parallel

        let intersectX = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
        let intersectY = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;

        return { x: intersectX, y: intersectY, z: 0, d: 1 };
    }

    /**
     * Finds the perpendicular distance from a point to an infinite line
     */
    static pointToLineDistance(pt, line) {
        let x0 = pt.x, y0 = pt.y;
        let x1 = line.startPoint.vec4.x, y1 = line.startPoint.vec4.y;
        let x2 = line.endpoint.vec4.x, y2 = line.endpoint.vec4.y;

        let numerator = Math.abs((x2 - x1) * (y1 - y0) - (x1 - x0) * (y2 - y1));
        let denominator = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

        if (denominator === 0) return this.distance(pt, {x: x1, y: y1});
        return numerator / denominator;
    }

    /**
     * Calculates the incenter coordinate and incircle radius of a triangle formed by 3 points
     */
    static getIncenter(pA, pB, pC) {
        let a = this.distance(pB, pC); // side length opposite to A
        let b = this.distance(pA, pC); // side length opposite to B
        let c = this.distance(pA, pB); // side length opposite to C

        let perimeter = a + b + c;
        if (perimeter === 0) return { x: pA.x, y: pA.y, r: 0 };

        let incenterX = (a * pA.x + b * pB.x + c * pC.x) / perimeter;
        let incenterY = (a * pA.y + b * pB.y + c * pC.y) / perimeter;

        // Semi-perimeter
        let s = perimeter / 2;
        // Area (Heron's formula)
        let area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
        let radius = area / s;

        return { x: incenterX, y: incenterY, r: radius, z: 0, d: 1 };
    }

    /**
     * Offsets an infinite line by a distance, returning an artificial line structure readable by lineIntersection
     */
    static offsetLine(line, offset) {
        let x1 = line.startPoint.vec4.x, y1 = line.startPoint.vec4.y;
        let x2 = line.endpoint.vec4.x, y2 = line.endpoint.vec4.y;
        let dx = x2 - x1, dy = y2 - y1;
        let len = Math.sqrt(dx*dx + dy*dy);
        let nx = -dy / len, ny = dx / len;
        
        return {
            startPoint: { vec4: { x: x1 + nx * offset, y: y1 + ny * offset } },
            endpoint: { vec4: { x: x2 + nx * offset, y: y2 + ny * offset } }
        };
    }

    /**
     * Determines the optimal circle center from 2 intersecting objects (Lines or Circles), a radius, and a quadrant hint
     */
    static getCircleCenter2T1R(objA, objB, radius, hintPt) {
        let primA = this.extractPrimitive(objA);
        let primB = this.extractPrimitive(objB);

        let offsetsA = this.getOffsetPrimitives(primA, radius);
        let offsetsB = this.getOffsetPrimitives(primB, radius);

        let centers = [];
        for (let oa of offsetsA) {
            for (let ob of offsetsB) {
                let inters = this.intersectPrimitives(oa, ob);
                centers.push(...inters);
            }
        }

        if (centers.length === 0) return { x: 0, y: 0, r: 0 }; 

        let bestCenter = centers[0];
        let minDist = this.distance(bestCenter, hintPt);
        
        for (let i = 1; i < centers.length; i++) {
            let d = this.distance(centers[i], hintPt);
            if (d < minDist) {
                minDist = d;
                bestCenter = centers[i];
            }
        }
        
        return { x: bestCenter.x, y: bestCenter.y, r: radius };
    }

    /** Helper: Extracts universal mathematical primitives from UI shapes */
    static extractPrimitive(obj) {
        if (obj.constructor.name === "DrawLine") {
            return {
                type: "line",
                x1: obj.startPoint.vec4.x, y1: obj.startPoint.vec4.y,
                x2: obj.endpoint.vec4.x, y2: obj.endpoint.vec4.y
            };
        } else if (obj.constructor.name === "DrawCircle") {
            return { type: "circle", cx: obj.centerPoint.vec4.x, cy: obj.centerPoint.vec4.y, r: obj.radius };
        } else if (obj.constructor.name === "DrawCircle3P" || obj.constructor.name === "DrawCircle3T") {
            // These objects use dynamic calculation that they internally store/return
            let circ = obj.constructor.name === "DrawCircle3P" ? obj.getCircumcenter() : obj.getIncircle();
            return { type: "circle", cx: circ.x, cy: circ.y, r: circ.r };
        } else if (obj.constructor.name === "DrawCircle2T1R") {
            let circ = obj.getIncircle();
            return { type: "circle", cx: circ.x, cy: circ.y, r: circ.r };
        }
        return null;
    }

    /** Helper: Offsets a primitive by a radius, returning positive and negative locus */
    static getOffsetPrimitives(prim, offsetDist) {
        if (prim.type === "line") {
            let dx = prim.x2 - prim.x1, dy = prim.y2 - prim.y1;
            let len = Math.sqrt(dx*dx + dy*dy);
            let nx = -dy / len, ny = dx / len;
            return [
                { type: "line", x1: prim.x1 + nx * offsetDist, y1: prim.y1 + ny * offsetDist, x2: prim.x2 + nx * offsetDist, y2: prim.y2 + ny * offsetDist },
                { type: "line", x1: prim.x1 - nx * offsetDist, y1: prim.y1 - ny * offsetDist, x2: prim.x2 - nx * offsetDist, y2: prim.y2 - ny * offsetDist }
            ];
        } else if (prim.type === "circle") {
            return [
                { type: "circle", cx: prim.cx, cy: prim.cy, r: prim.r + offsetDist },
                { type: "circle", cx: prim.cx, cy: prim.cy, r: Math.abs(prim.r - offsetDist) }
            ];
        }
        return [];
    }

    /** Intersects two mathematically defined primitives (returns array of {x, y} coordinate objects) */
    static intersectPrimitives(pA, pB) {
        if (pA.type === "line" && pB.type === "line") {
            let denom = (pA.x1 - pA.x2) * (pB.y1 - pB.y2) - (pA.y1 - pA.y2) * (pB.x1 - pB.x2);
            if (Math.abs(denom) < 0.0001) return [];
            let ix = ((pA.x1 * pA.y2 - pA.y1 * pA.x2) * (pB.x1 - pB.x2) - (pA.x1 - pA.x2) * (pB.x1 * pB.y2 - pB.y1 * pB.x2)) / denom;
            let iy = ((pA.x1 * pA.y2 - pA.y1 * pA.x2) * (pB.y1 - pB.y2) - (pA.y1 - pA.y2) * (pB.x1 * pB.y2 - pB.y1 * pB.x2)) / denom;
            return [{ x: ix, y: iy }];
        } 
        else if (pA.type === "circle" && pB.type === "circle") {
            let dx = pB.cx - pA.cx, dy = pB.cy - pA.cy;
            let d = Math.sqrt(dx*dx + dy*dy);
            if (d > pA.r + pB.r || d < Math.abs(pA.r - pB.r) || d === 0) return [];
            
            let a = (pA.r*pA.r - pB.r*pB.r + d*d) / (2*d);
            let h = Math.sqrt(Math.abs(pA.r*pA.r - a*a));
            let x2 = pA.cx + a * (dx/d);
            let y2 = pA.cy + a * (dy/d);
            
            let pos1 = { x: x2 + h * (dy/d), y: y2 - h * (dx/d) };
            let pos2 = { x: x2 - h * (dy/d), y: y2 + h * (dx/d) };
            return [pos1, pos2];
        } 
        else {
            // Line vs Circle
            let line = pA.type === "line" ? pA : pB;
            let circ = pA.type === "circle" ? pA : pB;
            
            let dx = line.x2 - line.x1, dy = line.y2 - line.y1;
            let dr = Math.sqrt(dx*dx + dy*dy);
            let D = (line.x1 - circ.cx) * (line.y2 - circ.cy) - (line.x2 - circ.cx) * (line.y1 - circ.cy); // determinant relative to circle center
            
            let discriminant = circ.r*circ.r * dr*dr - D*D;
            if (discriminant < 0) return []; // No intersection

            let signDy = dy < 0 ? -1 : 1;
            let ix1 = circ.cx + (D * dy + (dy === 0 ? 1 : signDy) * dx * Math.sqrt(discriminant)) / (dr*dr);
            let iy1 = circ.cy + (-D * dx + Math.abs(dy) * Math.sqrt(discriminant)) / (dr*dr);
            
            if (discriminant === 0) return [{ x: ix1, y: iy1 }];
            
            let ix2 = circ.cx + (D * dy - (dy === 0 ? 1 : signDy) * dx * Math.sqrt(discriminant)) / (dr*dr);
            let iy2 = circ.cy + (-D * dx - Math.abs(dy) * Math.sqrt(discriminant)) / (dr*dr);
            return [{ x: ix1, y: iy1 }, { x: ix2, y: iy2 }];
        }
    }

    /**
     * Determines the optimal circle center from 3 Tangent Objects (Lines or Circles) using numeric descent
     */
    static getCircleCenter3T(objA, objB, objC) {
        let prims = [this.extractPrimitive(objA), this.extractPrimitive(objB), this.extractPrimitive(objC)];
        
        // If all 3 are lines, use the exact mathematical circumcenter (Incenter of the triangle)
        if (prims.every(p => p.type === "line")) {
            let pA = this.intersectPrimitives(prims[0], prims[1])[0];
            let pB = this.intersectPrimitives(prims[1], prims[2])[0];
            let pC = this.intersectPrimitives(prims[2], prims[0])[0];
            if (!pA || !pB || !pC) return { x: 0, y: 0, r: 0 };
            return this.getIncenter(pA, pB, pC);
        }

        // Iterative Solver for Apollonius (Mix of Lines and Circles)
        // Initial guess: average of the primitives' positions
        let gx = 0, gy = 0;
        for (let p of prims) {
            if (p.type === "line") {
                gx += (p.x1 + p.x2) / 2;
                gy += (p.y1 + p.y2) / 2;
            } else {
                gx += p.cx;
                gy += p.cy;
            }
        }
        gx /= 3; gy /= 3;

        let r = 10; // initial radius guess
        let lr = 0.5; // learning rate
        let iterations = 2000;

        let distToTarget = (px, py, prim) => {
            if (prim.type === "line") {
                let num = Math.abs((prim.x2 - prim.x1)*(prim.y1 - py) - (prim.x1 - px)*(prim.y2 - prim.y1));
                let den = Math.sqrt(Math.pow(prim.x2 - prim.x1, 2) + Math.pow(prim.y2 - prim.y1, 2));
                return num / (den || 1);
            } else {
                let d = Math.sqrt(Math.pow(px - prim.cx, 2) + Math.pow(py - prim.cy, 2));
                return Math.abs(d - prim.r); // Distance to the circle's edge
            }
        };

        for (let i = 0; i < iterations; i++) {
            let d0 = distToTarget(gx, gy, prims[0]);
            let d1 = distToTarget(gx, gy, prims[1]);
            let d2 = distToTarget(gx, gy, prims[2]);

            // We want d0 == d1 == d2 == r. Loss is variance between them.
            let avgD = (d0 + d1 + d2) / 3;
            r = avgD;

            let error = Math.pow(d0 - avgD, 2) + Math.pow(d1 - avgD, 2) + Math.pow(d2 - avgD, 2);
            if (error < 0.001) break; // Converged

            // Numeric Gradient
            let eps = 0.001;
            let d0_dx = distToTarget(gx + eps, gy, prims[0]);
            let d1_dx = distToTarget(gx + eps, gy, prims[1]);
            let d2_dx = distToTarget(gx + eps, gy, prims[2]);
            let avgD_dx = (d0_dx + d1_dx + d2_dx) / 3;
            let gradX = (Math.pow(d0_dx - avgD_dx, 2) + Math.pow(d1_dx - avgD_dx, 2) + Math.pow(d2_dx - avgD_dx, 2) - error) / eps;

            let d0_dy = distToTarget(gx, gy + eps, prims[0]);
            let d1_dy = distToTarget(gx, gy + eps, prims[1]);
            let d2_dy = distToTarget(gx, gy + eps, prims[2]);
            let avgD_dy = (d0_dy + d1_dy + d2_dy) / 3;
            let gradY = (Math.pow(d0_dy - avgD_dy, 2) + Math.pow(d1_dy - avgD_dy, 2) + Math.pow(d2_dy - avgD_dy, 2) - error) / eps;

            gx -= lr * gradX;
            gy -= lr * gradY;
        }

        return { x: gx, y: gy, r: r };
    }

    /** Helper: Projects a circular center along the normal of a primitive to find the tangent touch point */
    static getTangentPoint(circCenter, obj) {
        let prim = this.extractPrimitive(obj);
        if (!prim) return null;

        if (prim.type === "line") {
            let dx = prim.x2 - prim.x1, dy = prim.y2 - prim.y1;
            let dot = ((circCenter.x - prim.x1) * dx + (circCenter.y - prim.y1) * dy) / (dx*dx + dy*dy);
            return { x: prim.x1 + dot * dx, y: prim.y1 + dot * dy };
        } else if (prim.type === "circle") {
            let dx = circCenter.x - prim.cx, dy = circCenter.y - prim.cy;
            let len = Math.sqrt(dx*dx + dy*dy);
            if (len === 0) return { x: prim.cx, y: prim.cy };
            return { x: prim.cx + (dx/len)*prim.r, y: prim.cy + (dy/len)*prim.r };
        }
        return null;
    }
}
