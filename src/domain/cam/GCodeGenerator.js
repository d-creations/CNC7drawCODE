const TAU = Math.PI * 2;
const DEFAULT_TOLERANCE = 1e-6;

function normalizeAngle(angle) {
    let normalized = angle % TAU;
    if (normalized < 0) normalized += TAU;
    return normalized;
}

function invertArcCommand(command) {
    return command === "G2" ? "G3" : "G2";
}

export class GCodeGenerator {
    constructor(constraintSystem, options = {}) {
        this.constraintSystem = constraintSystem;
        this.options = {
            includeHeader: true,
            includeFooter: true,
            rapidToStart: true,
            units: "G21",
            positioning: "G90",
            plane: "G17",
            circleDirection: "CW",
            decimals: 3,
            tolerance: DEFAULT_TOLERANCE,
            feedRate: null,
            ...options
        };
    }

    generatePath({ startPointId, sequenceIds = [] }) {
        if (!startPointId) {
            throw new Error("CAM export requires a startPointId.");
        }

        const startPoint = this.getPointById(startPointId);
        const lines = [];

        if (this.options.includeHeader) {
            lines.push(this.options.units);
            lines.push(this.options.positioning);
            lines.push(this.options.plane);
            if (this.options.feedRate !== null && this.options.feedRate !== undefined) {
                lines.push(`F${this.formatNumber(this.options.feedRate)}`);
            }
        }

        if (this.options.rapidToStart) {
            lines.push(this.makeMotionLine("G0", { x: startPoint.x, y: startPoint.y }));
        }

        let currentPoint = { ...startPoint };

        for (const sequenceId of sequenceIds) {
            const geometry = this.constraintSystem.geometries.get(sequenceId);
            if (!geometry) {
                throw new Error(`Cannot export CAM path: geometry '${sequenceId}' was not found.`);
            }

            if (geometry.type === "Point") {
                const point = this.getPointById(sequenceId);
                lines.push(this.makeMotionLine("G1", point));
                currentPoint = { ...point };
                continue;
            }

            if (geometry.type === "Line") {
                currentPoint = this.appendLineMove(lines, geometry, currentPoint);
                continue;
            }

            if (geometry.type === "Arc") {
                currentPoint = this.appendArcMove(lines, geometry, currentPoint);
                continue;
            }

            if (geometry.type === "Circle") {
                currentPoint = this.appendCircleMove(lines, geometry, currentPoint);
                continue;
            }

            throw new Error(`CAM export does not support geometry type '${geometry.type}'.`);
        }

        if (this.options.includeFooter) {
            lines.push("M30");
        }

        return lines.join("\n");
    }

    appendLineMove(lines, lineGeometry, currentPoint) {
        const startPoint = this.getPointById(lineGeometry.data.start);
        const endPoint = this.getPointById(lineGeometry.data.end);
        const nextPoint = this.resolveConnectedEndpoint(currentPoint, startPoint, endPoint, lineGeometry.id);
        lines.push(this.makeMotionLine("G1", nextPoint));
        return { ...nextPoint };
    }

    appendArcMove(lines, arcGeometry, currentPoint) {
        const centerPoint = this.getPointById(arcGeometry.data.center);
        const startPoint = arcGeometry.data.start
            ? this.getPointById(arcGeometry.data.start)
            : this.pointFromAngle(centerPoint, arcGeometry.data.r, arcGeometry.data.startAngle);
        const endPoint = arcGeometry.data.end
            ? this.getPointById(arcGeometry.data.end)
            : this.pointFromAngle(centerPoint, arcGeometry.data.r, arcGeometry.data.endAngle);

        let command = this.getPreferredArcCommand(arcGeometry.data.startAngle, arcGeometry.data.endAngle);
        let nextPoint = null;

        if (this.pointsEqual(currentPoint, startPoint)) {
            nextPoint = endPoint;
        } else if (this.pointsEqual(currentPoint, endPoint)) {
            nextPoint = startPoint;
            command = invertArcCommand(command);
        } else {
            throw new Error(`Arc '${arcGeometry.id}' is not connected to the current CAM point.`);
        }

        lines.push(this.makeMotionLine(command, nextPoint, {
            i: centerPoint.x - currentPoint.x,
            j: centerPoint.y - currentPoint.y
        }));

        return { ...nextPoint };
    }

    appendCircleMove(lines, circleGeometry, currentPoint) {
        const centerPoint = this.getPointById(circleGeometry.data.center);
        const radius = circleGeometry.data.r;
        const distanceToCenter = Math.hypot(currentPoint.x - centerPoint.x, currentPoint.y - centerPoint.y);

        if (Math.abs(distanceToCenter - radius) > this.options.tolerance) {
            throw new Error(`Circle '${circleGeometry.id}' requires the current CAM point to lie on its circumference.`);
        }

        const oppositePoint = {
            x: (2 * centerPoint.x) - currentPoint.x,
            y: (2 * centerPoint.y) - currentPoint.y
        };
        const command = this.options.circleDirection === "CCW" ? "G3" : "G2";

        lines.push(this.makeMotionLine(command, oppositePoint, {
            i: centerPoint.x - currentPoint.x,
            j: centerPoint.y - currentPoint.y
        }));
        lines.push(this.makeMotionLine(command, currentPoint, {
            i: centerPoint.x - oppositePoint.x,
            j: centerPoint.y - oppositePoint.y
        }));

        return { ...currentPoint };
    }

    resolveConnectedEndpoint(currentPoint, startPoint, endPoint, geometryId) {
        if (this.pointsEqual(currentPoint, startPoint)) {
            return endPoint;
        }
        if (this.pointsEqual(currentPoint, endPoint)) {
            return startPoint;
        }
        throw new Error(`Geometry '${geometryId}' is not connected to the current CAM point.`);
    }

    getPreferredArcCommand(startAngle = 0, endAngle = 0) {
        const ccwSweep = normalizeAngle(endAngle - startAngle);
        const cwSweep = TAU - ccwSweep;
        return ccwSweep <= cwSweep ? "G3" : "G2";
    }

    pointFromAngle(centerPoint, radius, angle) {
        return {
            x: centerPoint.x + (radius * Math.cos(angle)),
            y: centerPoint.y + (radius * Math.sin(angle))
        };
    }

    getPointById(pointId) {
        const geometry = this.constraintSystem.geometries.get(pointId);
        if (!geometry || geometry.type !== "Point") {
            throw new Error(`CAM export expected point '${pointId}'.`);
        }
        return { x: geometry.data.x, y: geometry.data.y };
    }

    pointsEqual(p1, p2) {
        return Math.abs(p1.x - p2.x) <= this.options.tolerance
            && Math.abs(p1.y - p2.y) <= this.options.tolerance;
    }

    makeMotionLine(code, point, ij = null) {
        const parts = [
            code,
            `X${this.formatNumber(point.x)}`,
            `Y${this.formatNumber(point.y)}`
        ];

        if (ij) {
            parts.push(`I${this.formatNumber(ij.i)}`);
            parts.push(`J${this.formatNumber(ij.j)}`);
        }

        return parts.join(" ");
    }

    formatNumber(value) {
        const normalized = Object.is(value, -0) ? 0 : value;
        const fixed = normalized.toFixed(this.options.decimals);
        return fixed.replace(/\.0+$|(?<=\.[0-9]*[1-9])0+$/g, "");
    }
}