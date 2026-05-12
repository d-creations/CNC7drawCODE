import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { DrawBoard } from '../../src/domain/core/DrawBoard.js';
import { Camera } from '../../src/domain/viewController/Camera.js';
import { ConstraintSystem } from '../../src/domain/constraints/ConstraintSystem.js';
import { LineTool } from '../../src/domain/tools/LineTool.js';
import { FilletArcTool } from '../../src/domain/tools/FilletArcTool.js';

global.window = {};
global.document = { addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

describe('FilletArcTool Integration', () => {
    let drawBoard;
    let constraintSystem;
    let mockCtx;
    let lineTool;
    let filletTool;

    beforeEach(() => {
        mockCtx = {
            beginPath: mock.fn(),
            moveTo: mock.fn(),
            lineTo: mock.fn(),
            stroke: mock.fn(),
            strokeRect: mock.fn(),
            clearRect: mock.fn(),
            fillText: mock.fn(),
            fillRect: mock.fn(),
            save: mock.fn(),
            restore: mock.fn(),
            translate: mock.fn(),
            rotate: mock.fn(),
            arc: mock.fn(),
            fill: mock.fn(),
            measureText: () => ({ width: 10 })
        };

        const camera = new Camera();
        const canvasMock = {
            width: 800,
            height: 600,
            getBoundingClientRect: () => ({ left: 0, top: 0 }),
            getContext: () => mockCtx
        };

        drawBoard = new DrawBoard(canvasMock, camera);
        constraintSystem = new ConstraintSystem();
        drawBoard.constraintSystem = constraintSystem;

        lineTool = new LineTool(drawBoard, constraintSystem);
        filletTool = new FilletArcTool(drawBoard, constraintSystem);
    });

    it('creates an arc fillet with tangent and radius constraints', () => {
        lineTool.onCanvasClick(0, 0);
        lineTool.onCanvasClick(20, 0);
        lineTool.onCanvasClick(0, 0);
        lineTool.onCanvasClick(0, 20);

        const lines = drawBoard.drawObjects.filter(obj => obj.constructor.name === 'DrawLine');
        assert.equal(lines.length, 2, 'Expected two source lines before adding the fillet');

        filletTool.onShapeSelected(lines[0]);
        filletTool.onShapeSelected(lines[1]);
        filletTool.tempRadius = 5;
        filletTool.onCanvasClick(2, 2);

        const arcGeometries = Array.from(constraintSystem.geometries.values()).filter(g => g.type === 'Arc');
        assert.equal(arcGeometries.length, 1, 'Expected one arc geometry for the fillet');
        assert.ok(Math.abs(arcGeometries[0].data.r - 5) < 1e-6, 'Fillet arc should keep the requested radius');

        const tangentConstraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === 'Tangent');
        assert.equal(tangentConstraints.length, 2, 'Expected two tangent constraints between the lines and the arc');

        const pointOnArcConstraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === 'PointOnArc');
        assert.equal(pointOnArcConstraints.length, 2, 'Expected arc endpoints to stay on the fillet radius');

        const radiusMeasurements = Array.from(constraintSystem.geometries.values()).filter(g => g.type === 'RadiusMeasurement');
        assert.equal(radiusMeasurements.length, 1, 'Expected a radius measurement geometry for the fillet');
        assert.ok(Math.abs(radiusMeasurements[0].data.value - 5) < 1e-6, 'Radius measurement should match the requested fillet radius');

        const points = Array.from(constraintSystem.geometries.values()).filter(g => g.type === 'Point');
        const tangent1 = points.find(p => Math.abs(p.data.x - 5) < 1e-6 && Math.abs(p.data.y) < 1e-6);
        const tangent2 = points.find(p => Math.abs(p.data.y - 5) < 1e-6 && Math.abs(p.data.x) < 1e-6);
        const center = points.find(p => Math.abs(p.data.x - 5) < 1e-6 && Math.abs(p.data.y - 5) < 1e-6);
        assert.ok(tangent1, 'Expected one tangent point on the horizontal line');
        assert.ok(tangent2, 'Expected one tangent point on the vertical line');
        assert.ok(center, 'Expected the fillet center point to be created');

        const radiusMeasurementObj = drawBoard.drawObjects.find(obj => obj.constructor.name === 'RadiusMeasurementShape');
        assert.ok(radiusMeasurementObj, 'Expected a visible radius measurement object for the fillet');
    });

    it('keeps the original corner point when that corner already has a measurement constraint', () => {
        lineTool.onCanvasClick(10, 10);
        lineTool.onCanvasClick(30, 10);
        lineTool.onCanvasClick(10, 10);
        lineTool.onCanvasClick(10, 30);

        const lines = drawBoard.drawObjects.filter(obj => obj.constructor.name === 'DrawLine');
        const sharedCornerPoint = [lines[0].startPoint, lines[0].endpoint].find(point => {
            return point.constraintId === lines[1].startPoint.constraintId || point.constraintId === lines[1].endpoint.constraintId;
        });
        assert.ok(sharedCornerPoint, 'Expected the shared corner point to exist before adding the fillet');

        const referencePointId = constraintSystem.addGeometry({
            type: 'Point',
            data: { x: 10, y: 20 },
            fixed: false
        });
        const measurementId = constraintSystem.addGeometry({
            type: 'VerticalMeasurement',
            data: {
                p1Id: sharedCornerPoint.constraintId,
                p2Id: referencePointId,
                value: 10
            },
            fixed: false
        });
        constraintSystem.addConstraint({
            type: 'VerticalMeasurement',
            targets: [sharedCornerPoint.constraintId, referencePointId],
            value: 10,
            geometryId: measurementId
        });

        filletTool.onShapeSelected(lines[0]);
        filletTool.onShapeSelected(lines[1]);
        filletTool.tempRadius = 5;
        filletTool.onCanvasClick(12, 12);

        assert.equal(constraintSystem.geometries.has(sharedCornerPoint.constraintId), true, 'Expected the constrained shared corner point to be preserved');

        const verticalConstraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === 'VerticalMeasurement');
        assert.equal(verticalConstraints.length, 1, 'Expected the original vertical measurement constraint to remain after filleting');
        assert.equal(verticalConstraints[0].targets.includes(sharedCornerPoint.constraintId), true, 'Expected the measurement to keep targeting the original constrained corner point');
    });
    });