import test, { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { DrawBoard } from '../../src/domain/core/DrawBoard.js';
import { LengthMeasurementTool } from "../../src/domain/tools/LengthMeasurementTool.js";
import { AngleMeasurementTool } from '../../src/domain/tools/AngleMeasurementTool.js';
import { AngleMeasurementShape } from '../../src/domain/shapes/AngleMeasurementShape.js';
import { DrawLine } from '../../src/domain/shapes/DrawLine.js';
import { Point } from '../../src/domain/shapes/Point.js';
import { Camera } from '../../src/domain/viewController/Camera.js';
import { Vec4 } from '../../src/domain/viewController/Camera.js';

// Global DOM shim
global.window = {};
global.document = { addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

describe("Phase 6: Measurement Tools Integration", () => {
    let drawBoard;
    let constraintSystem;
    let mockCtx;
    let lengthTool;
    let angleTool;

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
            arc: mock.fn(),
            fill: mock.fn(),
            translate: mock.fn(),
            rotate: mock.fn(),
            measureText: () => ({ width: 10 })
        };

        const canvasMock = { width: 800, height: 600, getBoundingClientRect: () => ({ left: 0, top: 0 }), getContext: () => mockCtx };
        const camera = new Camera();
        
        drawBoard = new DrawBoard(canvasMock, camera);
        constraintSystem = drawBoard.constraintSystem;

        lengthTool = new LengthMeasurementTool(drawBoard);
        angleTool = new AngleMeasurementTool(drawBoard);
    });

    function createPoint(x, y) {
        const pointId = constraintSystem.addGeometry({
            type: 'Point',
            data: { x, y },
            fixed: false
        });
        const point = new Point(new Vec4(x, y, 0, 1));
        point.constraintId = pointId;
        drawBoard.drawObjects.push(point);
        return point;
    }

    function createLine(startPoint, endPoint) {
        const lineId = constraintSystem.addGeometry({
            type: 'Line',
            data: { start: startPoint.constraintId, end: endPoint.constraintId },
            fixed: false
        });
        const line = new DrawLine(startPoint, endPoint);
        line.constraintId = lineId;
        drawBoard.drawObjects.push(line);
        return line;
    }

    it("should generate a Length Measurement shape and constraint between two points", () => {
        // Step 1: Click at (0, 0)
        lengthTool.onCanvasClick(0, 0);
        
        // Simulate Mouse move to initialize the temporary drawing shape
        lengthTool.onMouseMove(30, 40);

        // Step 2: Click at (30, 40)
        lengthTool.onCanvasClick(30, 40);
        
        // A length measurement creates a constraint in the system and a visual shape.
        let createdConstraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === "LengthMeasurement");
        assert.equal(createdConstraints.length, 1, "Exactly one LengthMeasurement constraint should be created");
        
        let constraint = createdConstraints[0];
        
        // Pythagoras: 30^2 + 40^2 = 900 + 1600 = 2500 -> sqrt(2500) = 50.
        assert.ok(Math.abs(constraint.value - 50) < 0.001, `The constrained value should be 50, got ${constraint.value}`);
        
        // Check visual array
        let lengthShapes = drawBoard.drawObjects.filter(o => o.constructor.name === "LengthMeasurementShape");
        assert.equal(lengthShapes.length, 1, "DrawBoard should contain the Length Measurement shape");
    });

    it("should finalize an Angle Measurement immediately after the second click", () => {
        const originA = createPoint(0, 0);
        const rayA = createPoint(80, 0);
        const originB = createPoint(0, 0);
        const rayB = createPoint(40, 69.2820323028);
        createLine(originA, rayA);
        createLine(originB, rayB);

        drawBoard.saveState = mock.fn();
        drawBoard.draw = mock.fn();

        angleTool.onCanvasClick(20, 0);
        angleTool.onCanvasClick(20, 34);

        const angleConstraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === 'AngleMeasurement');
        const angleShapes = drawBoard.drawObjects.filter(o => o.constructor.name === 'AngleMeasurementShape');

        assert.equal(angleConstraints.length, 1, 'Exactly one AngleMeasurement constraint should be created');
        assert.equal(angleShapes.length, 1, 'DrawBoard should contain the Angle Measurement shape immediately');
        assert.equal(drawBoard.saveState.mock.callCount(), 1, 'Angle creation should save immediately like length measurement');
        assert.equal(drawBoard.draw.mock.callCount(), 1, 'Angle creation should redraw immediately like length measurement');
    });

    it("should render the wrapped minor angle instead of the reflex arc", () => {
        const vertex1 = new Point(new Vec4(0, 0, 0, 1));
        const line1 = new DrawLine(vertex1, new Point(new Vec4(98.4807753012, -17.3648177667, 0, 1)));

        const vertex2 = new Point(new Vec4(0, 0, 0, 1));
        const line2 = new DrawLine(vertex2, new Point(new Vec4(98.4807753012, 17.3648177667, 0, 1)));

        const measurement = new AngleMeasurementShape(drawBoard, line1, line2);
        const [renderData] = measurement.getRenderData();

        assert.ok(renderData, 'Angle measurement should produce render data');

        const renderedAngle = renderData.a2 - renderData.a1;
        assert.ok(Math.abs(renderedAngle - (20 * Math.PI / 180)) < 1e-6, `Expected wrapped minor angle of 20 degrees, got ${renderedAngle}`);
        assert.ok(Math.abs(renderData.midAng) < 1e-6 || Math.abs(renderData.midAng - 2 * Math.PI) < 1e-6, `Expected midpoint near 0 degrees, got ${renderData.midAng}`);
    });

    it("should solve the same visible angle even when a line is stored in reverse direction", () => {
        const line1Far = createPoint(100, 0);
        const vertex = createPoint(0, 0);
        const line2Far = createPoint(0, 100);

        const line1 = createLine(line1Far, vertex);
        const line2 = createLine(vertex, line2Far);

        const measurementId = constraintSystem.addGeometry({
            type: 'AngleMeasurement',
            data: {
                l1Id: line1.constraintId,
                l2Id: line2.constraintId,
                value: 80 * Math.PI / 180
            },
            fixed: false
        });

        constraintSystem.addConstraint({
            type: 'AngleMeasurement',
            targets: [line1.startPoint.constraintId, line1.endpoint.constraintId, line2.startPoint.constraintId, line2.endpoint.constraintId],
            value: 80 * Math.PI / 180,
            geometryId: measurementId
        });

        const measurement = new AngleMeasurementShape(drawBoard, line1, line2);
        constraintSystem.solveLocal(line2.endpoint.constraintId);
        drawBoard.draw();

        const [renderData] = measurement.getRenderData();
        const displayedDegrees = (renderData.a2 - renderData.a1) * 180 / Math.PI;

        assert.ok(Math.abs(displayedDegrees - 80) < 0.5, `Expected displayed angle near 80 degrees after solve, got ${displayedDegrees}`);
    });
});
