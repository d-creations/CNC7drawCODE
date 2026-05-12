import { BaseTool } from "./BaseTool.js";
import { Geometry } from "../math/Geometry.js";
import { Point } from "../shapes/Point.js";
import { DrawArc } from "../shapes/DrawArc.js";
import { GeometricTangentShape } from "../shapes/GeometricTangentShape.js";
import { RadiusMeasurementShape } from "../shapes/RadiusMeasurementShape.js";
import { Vec4 } from "../viewController/Camera.js";

export class FilletArcTool extends BaseTool {
    constructor(drawBoard, constraintSystem) {
        super(drawBoard);
        this.constraintSystem = constraintSystem;
        this.selectedLines = [];
        this.selectedVisualLines = [];
        this.step = "selectLines";
        this.tempRadius = null;
    }

    onShapeSelected(shapeClicked) {
        if (this.step !== "selectLines") return;
        if (shapeClicked?.constructor?.name !== "DrawLine") return;
        if (this.selectedVisualLines.includes(shapeClicked)) return;

        this.selectedLines.push(shapeClicked.constraintId);
        this.selectedVisualLines.push(shapeClicked);
        shapeClicked.changeColor("orange");
        this.drawBoard.draw();

        if (this.selectedLines.length === 2) {
            this.step = "placeRadiusHint";
        }
    }

    onCanvasClick(x, y) {
        if (this.step !== "placeRadiusHint") return;

        const worldVec = this.drawBoard.camera.getWorldVec(x, y);
        const hintPoint = new Vec4(worldVec.x, worldVec.y, 0, 1);
        this.generateConstrainedFillet(hintPoint);
        this.cancel();
    }

    cancel() {
        this.selectedVisualLines.forEach(line => line.changeColor(line.defaultColor || "red"));
        this.selectedLines = [];
        this.selectedVisualLines = [];
        this.step = "selectLines";
        this.tempRadius = null;
        this.drawBoard.clearTempObjects();
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

    createPoint(x, y) {
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
        this.drawBoard.drawObjects = this.drawBoard.drawObjects.filter(obj => !(obj.constraintId && sharedRemovalIds.includes(obj.constraintId)));
    }

    normalizeAngle(angle) {
        let normalized = angle % (2 * Math.PI);
        if (normalized < 0) normalized += 2 * Math.PI;
        return normalized;
    }

    isAngleOnCcwSweep(startAngle, endAngle, testAngle) {
        const start = this.normalizeAngle(startAngle);
        const end = this.normalizeAngle(endAngle);
        const test = this.normalizeAngle(testAngle);
        const sweep = (end - start + 2 * Math.PI) % (2 * Math.PI);
        const testSweep = (test - start + 2 * Math.PI) % (2 * Math.PI);
        return testSweep <= sweep;
    }

    generateConstrainedFillet(hintPoint) {
        const [line1, line2] = this.selectedVisualLines;
        const sharedPoint = this.getSharedCorner(line1, line2);
        if (!sharedPoint?.constraintId) {
            console.warn("[FilletArcTool] Fillet requires two lines that share a corner point.");
            return;
        }

        if (!(this.tempRadius > 0)) {
            console.warn("[FilletArcTool] Radius must be greater than zero.");
            return;
        }

        const otherPoint1 = this.getOtherPoint(line1, sharedPoint);
        const otherPoint2 = this.getOtherPoint(line2, sharedPoint);
        if (!otherPoint1 || !otherPoint2) {
            console.warn("[FilletArcTool] Could not resolve both line branches around the corner.");
            return;
        }

        const centerData = Geometry.getCircleCenter2T1R(line1, line2, this.tempRadius, hintPoint);
        if (!centerData || centerData.r <= 0) {
            console.warn("[FilletArcTool] Could not solve a fillet center for the selected lines.");
            return;
        }

        const centerPoint = { x: centerData.x, y: centerData.y };
        const tangent1 = Geometry.getTangentPoint(centerPoint, line1);
        const tangent2 = Geometry.getTangentPoint(centerPoint, line2);
        if (!tangent1 || !tangent2) {
            console.warn("[FilletArcTool] Could not compute tangent points for the fillet.");
            return;
        }

        const dist1 = Math.hypot(tangent1.x - otherPoint1.x, tangent1.y - otherPoint1.y);
        const dist2 = Math.hypot(tangent2.x - otherPoint2.x, tangent2.y - otherPoint2.y);
        const original1 = Math.hypot(sharedPoint.x - otherPoint1.x, sharedPoint.y - otherPoint1.y);
        const original2 = Math.hypot(sharedPoint.x - otherPoint2.x, sharedPoint.y - otherPoint2.y);
        if (dist1 >= original1 || dist2 >= original2) {
            console.warn("[FilletArcTool] Radius is too large for the selected corner.");
            return;
        }

        const trimmed1 = this.createPoint(tangent1.x, tangent1.y);
        const trimmed2 = this.createPoint(tangent2.x, tangent2.y);
        this.updateLineEndpoint(line1, sharedPoint.constraintId, trimmed1.pointId, trimmed1.pointObj);
        this.updateLineEndpoint(line2, sharedPoint.constraintId, trimmed2.pointId, trimmed2.pointObj);
        this.cleanupDetachedCorner(sharedPoint.constraintId);

        const center = this.createPoint(centerPoint.x, centerPoint.y);
        const startAngle = Math.atan2(trimmed1.pointObj.y - center.pointObj.y, trimmed1.pointObj.x - center.pointObj.x);
        const endAngle = Math.atan2(trimmed2.pointObj.y - center.pointObj.y, trimmed2.pointObj.x - center.pointObj.x);
        const cornerAngle = Math.atan2(sharedPoint.y - center.pointObj.y, sharedPoint.x - center.pointObj.x);
        const useDirectSweep = this.isAngleOnCcwSweep(startAngle, endAngle, cornerAngle);

        const arcId = this.constraintSystem.addGeometry({
            type: "Arc",
            data: {
                center: center.pointId,
                start: trimmed1.pointId,
                end: trimmed2.pointId,
                r: this.tempRadius,
                startAngle: useDirectSweep ? startAngle : endAngle,
                endAngle: useDirectSweep ? endAngle : startAngle
            },
            fixed: false
        });

        const tangentShapeId1 = this.constraintSystem.addGeometry({ type: "GeometricTangent", data: { target1Id: line1.constraintId, target2Id: arcId }, fixed: false });
        const tangentShapeId2 = this.constraintSystem.addGeometry({ type: "GeometricTangent", data: { target1Id: line2.constraintId, target2Id: arcId }, fixed: false });
        this.constraintSystem.addConstraint({ type: "Tangent", targets: [line1.constraintId, arcId], geometryId: tangentShapeId1 });
        this.constraintSystem.addConstraint({ type: "Tangent", targets: [line2.constraintId, arcId], geometryId: tangentShapeId2 });
        this.constraintSystem.addConstraint({ type: "PointOnArc", targets: [arcId, trimmed1.pointId] });
        this.constraintSystem.addConstraint({ type: "PointOnArc", targets: [arcId, trimmed2.pointId] });

        const measurementId = this.constraintSystem.addGeometry({
            type: "RadiusMeasurement",
            data: {
                circleId: arcId,
                value: this.tempRadius,
                angle: Math.PI / 4
            },
            fixed: false
        });
        this.constraintSystem.addConstraint({
            type: "RadiusMeasurement",
            targets: [arcId],
            value: this.tempRadius,
            geometryId: measurementId
        });

        const arcObj = new DrawArc(center.pointObj, this.tempRadius, useDirectSweep ? startAngle : endAngle, useDirectSweep ? endAngle : startAngle, trimmed1.pointObj, trimmed2.pointObj);
        arcObj.constraintId = arcId;
        this.drawBoard.drawObjects.push(arcObj);

        const tangentShape1 = new GeometricTangentShape(this.drawBoard, line1, arcObj);
        tangentShape1.constraintId = tangentShapeId1;
        const tangentShape2 = new GeometricTangentShape(this.drawBoard, line2, arcObj);
        tangentShape2.constraintId = tangentShapeId2;
        this.drawBoard.drawObjects.push(tangentShape1, tangentShape2);

        const radiusMeasurement = new RadiusMeasurementShape(this.drawBoard, arcObj);
        radiusMeasurement.constraintId = measurementId;
        this.drawBoard.drawObjects.push(radiusMeasurement);

        this.drawBoard.needsUpdate = true;
        this.drawBoard.saveState();
        this.drawBoard.draw();
    }
}