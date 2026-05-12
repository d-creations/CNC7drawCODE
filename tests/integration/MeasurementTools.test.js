import test, { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { DrawBoard } from '../../src/domain/core/DrawBoard.js';
import { LengthMeasurementTool } from "../../src/domain/tools/LengthMeasurementTool.js";
import { HorizontalMeasurementTool } from '../../src/domain/tools/HorizontalMeasurementTool.js';
import { VerticalMeasurementTool } from '../../src/domain/tools/VerticalMeasurementTool.js';
import { AngleMeasurementTool } from '../../src/domain/tools/AngleMeasurementTool.js';
import { GeometricHorizontalTool } from '../../src/domain/tools/GeometricHorizontalTool.js';
import { GeometricVerticalTool } from '../../src/domain/tools/GeometricVerticalTool.js';
import { AngleMeasurementShape } from '../../src/domain/shapes/AngleMeasurementShape.js';
import { DrawArc } from '../../src/domain/shapes/DrawArc.js';
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
    let horizontalTool;
    let verticalTool;
    let angleTool;
    let geometricHorizontalTool;
    let geometricVerticalTool;

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
        horizontalTool = new HorizontalMeasurementTool(drawBoard);
        verticalTool = new VerticalMeasurementTool(drawBoard);
        angleTool = new AngleMeasurementTool(drawBoard);
        geometricHorizontalTool = new GeometricHorizontalTool(drawBoard);
        geometricVerticalTool = new GeometricVerticalTool(drawBoard);
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

    function createArc(centerPoint, startPoint, endPoint, radius, startAngle, endAngle) {
        const arcId = constraintSystem.addGeometry({
            type: 'Arc',
            data: {
                center: centerPoint.constraintId,
                start: startPoint.constraintId,
                end: endPoint.constraintId,
                r: radius,
                startAngle,
                endAngle
            },
            fixed: false
        });
        const arc = new DrawArc(centerPoint, radius, startAngle, endAngle, startPoint, endPoint);
        arc.constraintId = arcId;
        drawBoard.drawObjects.push(arc);
        return arc;
    }

    it("should generate a Length Measurement shape and constraint between two points", () => {
        const p1 = createPoint(20, 10);
        const p2 = createPoint(50, 50);

        // Step 1: Click existing point
        lengthTool.onCanvasClick(20, 10);
        
        // Simulate Mouse move to initialize the temporary drawing shape
        lengthTool.onMouseMove(50, 50);

        // Step 2: Click existing point
        lengthTool.onCanvasClick(50, 50);
        
        // A length measurement creates a constraint in the system and a visual shape.
        let createdConstraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === "LengthMeasurement");
        assert.equal(createdConstraints.length, 1, "Exactly one LengthMeasurement constraint should be created");
        
        let constraint = createdConstraints[0];
        
        // Pythagoras: 30^2 + 40^2 = 900 + 1600 = 2500 -> sqrt(2500) = 50.
        assert.ok(Math.abs(constraint.value - 50) < 0.001, `The constrained value should be 50, got ${constraint.value}`);
        
        // Check visual array
        let lengthShapes = drawBoard.drawObjects.filter(o => o.constructor.name === "LengthMeasurementShape");
        assert.equal(lengthShapes.length, 1, "DrawBoard should contain the Length Measurement shape");
        assert.equal(createdConstraints[0].targets[0], p1.constraintId, 'The measurement should start at the selected point');
        assert.equal(createdConstraints[0].targets[1], p2.constraintId, 'The measurement should end at the selected point');
    });

    it("should ignore empty canvas clicks for measurement tools", () => {
        const initialPointCount = Array.from(constraintSystem.geometries.values()).filter(g => g.type === 'Point').length;
        const initialMeasurementCount = Array.from(constraintSystem.constraints.values()).filter(c => ["LengthMeasurement", "HorizontalMeasurement", "VerticalMeasurement"].includes(c.type)).length;

        lengthTool.onCanvasClick(200, 200);
        horizontalTool.onCanvasClick(220, 220);
        verticalTool.onCanvasClick(240, 240);

        const pointCount = Array.from(constraintSystem.geometries.values()).filter(g => g.type === 'Point').length;
        const measurementCount = Array.from(constraintSystem.constraints.values()).filter(c => ["LengthMeasurement", "HorizontalMeasurement", "VerticalMeasurement"].includes(c.type)).length;

        assert.equal(pointCount, initialPointCount, 'Empty clicks should not create any points');
        assert.equal(measurementCount, initialMeasurementCount, 'Empty clicks should not create any measurements');
    });

    it("should create a Length Measurement from a single line click", () => {
        const p1 = createPoint(0, 0);
        const p2 = createPoint(100, 0);
        createLine(p1, p2);

        drawBoard.saveState = mock.fn();
        drawBoard.draw = mock.fn();

        lengthTool.onCanvasClick(50, 0);

        const lengthConstraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === 'LengthMeasurement');
        const lengthShapes = drawBoard.drawObjects.filter(o => o.constructor.name === 'LengthMeasurementShape');

        assert.equal(lengthConstraints.length, 1, 'Exactly one LengthMeasurement constraint should be created');
        assert.equal(lengthShapes.length, 1, 'DrawBoard should contain one Length Measurement shape');
        assert.equal(lengthConstraints[0].targets[0], p1.constraintId, 'The measurement should start at the line start point');
        assert.equal(lengthConstraints[0].targets[1], p2.constraintId, 'The measurement should end at the line end point');
        assert.equal(drawBoard.saveState.mock.callCount(), 1, 'Shape-click length creation should save immediately');
        assert.equal(drawBoard.draw.mock.callCount(), 1, 'Shape-click length creation should redraw immediately');
    });

    it("should create a Length Measurement from a single arc click", () => {
        const center = createPoint(0, 0);
        const start = createPoint(50, 0);
        const end = createPoint(0, 50);
        createArc(center, start, end, 50, 0, Math.PI / 2);

        drawBoard.saveState = mock.fn();
        drawBoard.draw = mock.fn();

        lengthTool.onCanvasClick(35, 35);

        const lengthConstraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === 'LengthMeasurement');
        const lengthShapes = drawBoard.drawObjects.filter(o => o.constructor.name === 'LengthMeasurementShape');

        assert.equal(lengthConstraints.length, 1, 'Exactly one LengthMeasurement constraint should be created');
        assert.equal(lengthShapes.length, 1, 'DrawBoard should contain one Length Measurement shape');
        assert.equal(lengthConstraints[0].targets[0], start.constraintId, 'The measurement should start at the arc start point');
        assert.equal(lengthConstraints[0].targets[1], end.constraintId, 'The measurement should end at the arc end point');
        assert.equal(drawBoard.saveState.mock.callCount(), 1, 'Arc-click length creation should save immediately');
        assert.equal(drawBoard.draw.mock.callCount(), 1, 'Arc-click length creation should redraw immediately');
    });

    it("should create a Horizontal Measurement from a single line click", () => {
        const p1 = createPoint(0, 0);
        const p2 = createPoint(100, 40);
        createLine(p1, p2);

        drawBoard.saveState = mock.fn();
        drawBoard.draw = mock.fn();

        horizontalTool.onCanvasClick(50, 20);

        const constraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === 'HorizontalMeasurement');
        const shapes = drawBoard.drawObjects.filter(o => o.constructor.name === 'HorizontalMeasurementShape');

        assert.equal(constraints.length, 1, 'Exactly one HorizontalMeasurement constraint should be created');
        assert.equal(shapes.length, 1, 'DrawBoard should contain one Horizontal Measurement shape');
        assert.equal(constraints[0].targets[0], p1.constraintId, 'The measurement should start at the line start point');
        assert.equal(constraints[0].targets[1], p2.constraintId, 'The measurement should end at the line end point');
        assert.equal(constraints[0].value, 100, 'The horizontal measurement should use the endpoint X distance');
        assert.equal(drawBoard.saveState.mock.callCount(), 1, 'Shape-click horizontal measurement should save immediately');
        assert.equal(drawBoard.draw.mock.callCount(), 1, 'Shape-click horizontal measurement should redraw immediately');
    });

    it("should create a Vertical Measurement from a single arc click", () => {
        const center = createPoint(0, 0);
        const start = createPoint(50, 0);
        const end = createPoint(0, 50);
        createArc(center, start, end, 50, 0, Math.PI / 2);

        drawBoard.saveState = mock.fn();
        drawBoard.draw = mock.fn();

        verticalTool.onCanvasClick(35, 35);

        const constraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === 'VerticalMeasurement');
        const shapes = drawBoard.drawObjects.filter(o => o.constructor.name === 'VerticalMeasurementShape');

        assert.equal(constraints.length, 1, 'Exactly one VerticalMeasurement constraint should be created');
        assert.equal(shapes.length, 1, 'DrawBoard should contain one Vertical Measurement shape');
        assert.equal(constraints[0].targets[0], start.constraintId, 'The measurement should start at the arc start point');
        assert.equal(constraints[0].targets[1], end.constraintId, 'The measurement should end at the arc end point');
        assert.equal(constraints[0].value, 50, 'The vertical measurement should use the endpoint Y distance');
        assert.equal(drawBoard.saveState.mock.callCount(), 1, 'Shape-click vertical measurement should save immediately');
        assert.equal(drawBoard.draw.mock.callCount(), 1, 'Shape-click vertical measurement should redraw immediately');
    });

    it("should create a Horizontal constraint from a single line click", () => {
        const p1 = createPoint(0, 0);
        const p2 = createPoint(100, 40);
        createLine(p1, p2);

        drawBoard.saveState = mock.fn();
        drawBoard.draw = mock.fn();

        geometricHorizontalTool.onCanvasClick(50, 20);

        const constraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === 'Horizontal');
        const shapes = drawBoard.drawObjects.filter(o => o.constructor.name === 'GeometricHorizontalShape');
        const p1Data = constraintSystem.geometries.get(p1.constraintId).data;
        const p2Data = constraintSystem.geometries.get(p2.constraintId).data;

        assert.equal(constraints.length, 1, 'Exactly one Horizontal constraint should be created');
        assert.equal(shapes.length, 1, 'DrawBoard should contain one geometric horizontal shape');
        assert.ok(Math.abs(p1Data.y - p2Data.y) < 0.001, `The selected endpoints should be solved horizontally, got y=${p1Data.y} and y=${p2Data.y}`);
        assert.equal(drawBoard.saveState.mock.callCount(), 1, 'Shape-click horizontal constraint should save immediately');
        assert.equal(drawBoard.draw.mock.callCount(), 1, 'Shape-click horizontal constraint should redraw immediately');
    });

    it("should create a Vertical constraint from a single arc click", () => {
        const center = createPoint(0, 0);
        const start = createPoint(50, 0);
        const end = createPoint(0, 50);
        createArc(center, start, end, 50, 0, Math.PI / 2);

        drawBoard.saveState = mock.fn();
        drawBoard.draw = mock.fn();

        geometricVerticalTool.onCanvasClick(35, 35);

        const constraints = Array.from(constraintSystem.constraints.values()).filter(c => c.type === 'Vertical');
        const shapes = drawBoard.drawObjects.filter(o => o.constructor.name === 'GeometricVerticalShape');
        const startData = constraintSystem.geometries.get(start.constraintId).data;
        const endData = constraintSystem.geometries.get(end.constraintId).data;

        assert.equal(constraints.length, 1, 'Exactly one Vertical constraint should be created');
        assert.equal(shapes.length, 1, 'DrawBoard should contain one geometric vertical shape');
        assert.ok(Math.abs(startData.x - endData.x) < 0.001, `The selected endpoints should be solved vertically, got x=${startData.x} and x=${endData.x}`);
        assert.equal(drawBoard.saveState.mock.callCount(), 1, 'Shape-click vertical constraint should save immediately');
        assert.equal(drawBoard.draw.mock.callCount(), 1, 'Shape-click vertical constraint should redraw immediately');
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
