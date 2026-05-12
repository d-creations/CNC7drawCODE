import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { DrawBoard } from '../../src/domain/core/DrawBoard.js';
import { Camera } from '../../src/domain/viewController/Camera.js';
import { ConstraintSystem } from '../../src/domain/constraints/ConstraintSystem.js';
import { LineTool } from '../../src/domain/tools/LineTool.js';
import { CornerChamfer45Tool } from '../../src/domain/tools/CornerChamfer45Tool.js';

global.window = {};
global.document = { addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

describe('CornerChamfer45Tool Integration', () => {
    let drawBoard;
    let constraintSystem;
    let mockCtx;
    let lineTool;
    let chamferTool;

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
        chamferTool = new CornerChamfer45Tool(drawBoard, constraintSystem);
    });

    it('creates a fixed 45 degree chamfer edge between perpendicular lines', () => {
        lineTool.onCanvasClick(0, 0);
        lineTool.onCanvasClick(20, 0);
        lineTool.onCanvasClick(0, 0);
        lineTool.onCanvasClick(0, 20);

        const lines = drawBoard.drawObjects.filter(obj => obj.constructor.name === 'DrawLine');
        assert.equal(lines.length, 2, 'Expected two source lines before chamfering');

        chamferTool.onShapeSelected(lines[0], 10);
        chamferTool.onShapeSelected(lines[1], 10);

        const lineGeometries = Array.from(constraintSystem.geometries.values()).filter(g => g.type === 'Line');
        assert.equal(lineGeometries.length, 3, 'Expected the chamfer to add a third line');

        const measurements = Array.from(constraintSystem.geometries.values()).filter(g => g.type === 'LengthMeasurement');
        assert.equal(measurements.length, 1, 'Expected a fixed length measurement for the new edge');
        assert.ok(Math.abs(measurements[0].data.value - 10) < 1e-6, 'Chamfer edge should store the requested edge size');

        const chamferLine = drawBoard.drawObjects.find(obj => {
            return obj.constructor.name === 'DrawLine'
                && Math.abs(Math.hypot(obj.endpoint.x - obj.startPoint.x, obj.endpoint.y - obj.startPoint.y) - 10) < 1e-6;
        });

        assert.ok(chamferLine, 'Expected a visual chamfer line with the configured edge size');

        const trim = 10 / Math.SQRT2;
        const points = Array.from(constraintSystem.geometries.values()).filter(g => g.type === 'Point');
        const trimPoint1 = points.find(p => Math.abs(p.data.x - trim) < 1e-6 && Math.abs(p.data.y) < 1e-6);
        const trimPoint2 = points.find(p => Math.abs(p.data.y - trim) < 1e-6 && Math.abs(p.data.x) < 1e-6);
        assert.ok(trimPoint1, 'Expected a trimmed point on the horizontal leg');
        assert.ok(trimPoint2, 'Expected a trimmed point on the vertical leg');
        const sharedCorner = points.find(p => Math.abs(p.data.x) < 1e-6 && Math.abs(p.data.y) < 1e-6);
        assert.equal(sharedCorner, undefined, 'Expected the shared corner point to be replaced by the chamfer');
    });
    });