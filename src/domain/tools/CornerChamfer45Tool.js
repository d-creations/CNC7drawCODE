import { BaseTool } from "./BaseTool.js";
import { Point } from "../shapes/Point.js";
import { DrawLine } from "../shapes/DrawLine.js";
import { LengthMeasurementShape } from "../shapes/LengthMeasurementShape.js";
import { Vec4 } from "../viewController/Camera.js";

export class CornerChamfer45Tool extends BaseTool {
    constructor(drawBoard, constraintSystem) {
        super(drawBoard);
        this.constraintSystem = constraintSystem;
        this.selectedVisualLines = [];
        this.edgeSize = 10;
    }

    onShapeSelected(shapeClicked, edgeSize = this.edgeSize) {
        if (shapeClicked?.constructor?.name !== "DrawLine") return;
        if (this.selectedVisualLines.includes(shapeClicked)) return;

        this.edgeSize = edgeSize;
        this.selectedVisualLines.push(shapeClicked);
        shapeClicked.changeColor("orange");
        this.drawBoard.draw();

        if (this.selectedVisualLines.length === 2) {
            this.applyChamfer();
        }
    }

    resetSelectionColors() {
        for (const line of this.selectedVisualLines) {
            if (line?.changeColor) {
                line.changeColor(line.defaultColor || "red");
            }
        }
    }

    cancel() {
        this.resetSelectionColors();
        this.selectedVisualLines = [];
        this.drawBoard.draw();
    }

    getSharedCorner(line1, line2) {
        const line1Points = [line1.startPoint, line1.endpoint];
        const line2Points = [line2.startPoint, line2.endpoint];

        for (const p1 of line1Points) {
            for (const p2 of line2Points) {
                if (p1?.constraintId && p1.constraintId === p2?.constraintId) {
                    return p1;
                }
            }
        }

        return null;
    }

    getOtherPoint(line, sharedPoint) {
        if (line.startPoint?.constraintId === sharedPoint.constraintId) return line.endpoint;
        if (line.endpoint?.constraintId === sharedPoint.constraintId) return line.startPoint;
        return null;
    }

    updateLineEndpoint(line, sharedPointId, newPointId, newPointObj) {
        const lineGeo = this.constraintSystem.geometries.get(line.constraintId);
        if (!lineGeo) return;

        if (lineGeo.data.start === sharedPointId) {
            lineGeo.data.start = newPointId;
            line.startPoint = newPointObj;
        } else if (lineGeo.data.end === sharedPointId) {
            lineGeo.data.end = newPointId;
            line.endpoint = newPointObj;
        }
    }

    createTrimPoint(cornerPoint, unitVec, trimDistance) {
        const x = cornerPoint.x + unitVec.x * trimDistance;
        const y = cornerPoint.y + unitVec.y * trimDistance;

        const pointId = this.constraintSystem.addGeometry({
            type: "Point",
            data: { x, y },
            fixed: false
        });

        const pointObj = new Point(new Vec4(x, y, 0, 1));
        pointObj.constraintId = pointId;
        this.drawBoard.drawObjects.push(pointObj);

        return { pointId, pointObj };
    }

    cleanupDetachedCorner(sharedPointId) {
        this.constraintSystem.buildGraph();
        const remainingConstraints = this.constraintSystem.graph.get(sharedPointId) || [];
        const remainingDependents = this.constraintSystem.dag.nodes.get(sharedPointId)?.dependents || new Set();

        if (remainingConstraints.length > 0 || remainingDependents.size > 0) {
            return;
        }

        const sharedRemovalIds = this.constraintSystem.removeGeometry(sharedPointId);
        this.drawBoard.drawObjects = this.drawBoard.drawObjects.filter(obj => {
            return !(obj.constraintId && sharedRemovalIds.includes(obj.constraintId));
        });
    }

    applyChamfer() {
        const [line1, line2] = this.selectedVisualLines;
        const sharedPoint = this.getSharedCorner(line1, line2);

        if (!sharedPoint?.constraintId) {
            console.warn("[CornerChamfer45Tool] Chamfer needs two lines that share a corner point.");
            this.cancel();
            return;
        }

        const otherPoint1 = this.getOtherPoint(line1, sharedPoint);
        const otherPoint2 = this.getOtherPoint(line2, sharedPoint);
        if (!otherPoint1 || !otherPoint2) {
            console.warn("[CornerChamfer45Tool] Could not resolve the line endpoints around the corner.");
            this.cancel();
            return;
        }

        const vec1 = { x: otherPoint1.x - sharedPoint.x, y: otherPoint1.y - sharedPoint.y };
        const vec2 = { x: otherPoint2.x - sharedPoint.x, y: otherPoint2.y - sharedPoint.y };
        const len1 = Math.hypot(vec1.x, vec1.y);
        const len2 = Math.hypot(vec2.x, vec2.y);
        if (len1 < 1e-6 || len2 < 1e-6) {
            console.warn("[CornerChamfer45Tool] Cannot chamfer zero-length line segments.");
            this.cancel();
            return;
        }

        const unit1 = { x: vec1.x / len1, y: vec1.y / len1 };
        const unit2 = { x: vec2.x / len2, y: vec2.y / len2 };
        const dot = unit1.x * unit2.x + unit1.y * unit2.y;
        if (Math.abs(dot) > 0.01) {
            console.warn("[CornerChamfer45Tool] This tool currently supports perpendicular corners only.");
            this.cancel();
            return;
        }

        if (!(this.edgeSize > 0)) {
            console.warn("[CornerChamfer45Tool] Chamfer edge size must be greater than zero.");
            this.cancel();
            return;
        }

        const trimDistance = this.edgeSize / Math.SQRT2;
        if (trimDistance >= len1 || trimDistance >= len2) {
            console.warn("[CornerChamfer45Tool] Chamfer edge size is too large for the selected corner.");
            this.cancel();
            return;
        }

        const trimmed1 = this.createTrimPoint(sharedPoint, unit1, trimDistance);
        const trimmed2 = this.createTrimPoint(sharedPoint, unit2, trimDistance);

        this.updateLineEndpoint(line1, sharedPoint.constraintId, trimmed1.pointId, trimmed1.pointObj);
        this.updateLineEndpoint(line2, sharedPoint.constraintId, trimmed2.pointId, trimmed2.pointObj);
        this.cleanupDetachedCorner(sharedPoint.constraintId);

        const chamferLineId = this.constraintSystem.addGeometry({
            type: "Line",
            data: { start: trimmed1.pointId, end: trimmed2.pointId },
            fixed: false
        });

        const chamferLine = new DrawLine(trimmed1.pointObj, trimmed2.pointObj);
        chamferLine.constraintId = chamferLineId;
        this.drawBoard.drawObjects.push(chamferLine);

        const measurementId = this.constraintSystem.addGeometry({
            type: "LengthMeasurement",
            data: {
                p1Id: trimmed1.pointId,
                p2Id: trimmed2.pointId,
                value: this.edgeSize
            },
            fixed: false
        });

        this.constraintSystem.addConstraint({
            type: "LengthMeasurement",
            targets: [trimmed1.pointId, trimmed2.pointId],
            value: this.edgeSize,
            geometryId: measurementId
        });

        const measurement = new LengthMeasurementShape(this.drawBoard, trimmed1.pointObj, trimmed2.pointObj);
        measurement.constraintId = measurementId;
        this.drawBoard.drawObjects.push(measurement);

        this.resetSelectionColors();
        this.selectedVisualLines = [];
        this.drawBoard.needsUpdate = true;
        this.drawBoard.saveState();
        this.drawBoard.draw();
    }
}