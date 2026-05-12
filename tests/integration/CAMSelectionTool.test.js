import test, { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { DrawBoard } from '../../src/domain/core/DrawBoard.js';
import { Camera } from '../../src/domain/viewController/Camera.js';
import { CAMSelectionTool } from '../../src/domain/tools/CAMSelectionTool.js';
import { Point } from '../../src/domain/shapes/Point.js';
import { DrawLine } from '../../src/domain/shapes/DrawLine.js';
import { DrawArc } from '../../src/domain/shapes/DrawArc.js';
import { Vec4 } from '../../src/domain/viewController/Camera.js';

global.window = {};
global.document = {
    addEventListener: () => {}
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

describe('CAM selection tool', () => {
    let drawBoard;
    let camTool;

    beforeEach(() => {
        const mockCtx = {
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
            measureText: () => ({ width: 10 })
        };

        const canvasMock = {
            width: 800,
            height: 600,
            getBoundingClientRect: () => ({ left: 0, top: 0 }),
            getContext: () => mockCtx
        };

        drawBoard = new DrawBoard(canvasMock, new Camera());
        camTool = new CAMSelectionTool(drawBoard);
    });

    it('builds an ordered line and arc CAM path from clicked geometry', () => {
        drawBoard.constraintSystem.addGeometry({ id: 'p1', type: 'Point', data: { x: 0, y: 0 }, fixed: false });
        drawBoard.constraintSystem.addGeometry({ id: 'p2', type: 'Point', data: { x: 10, y: 0 }, fixed: false });
        drawBoard.constraintSystem.addGeometry({ id: 'p3', type: 'Point', data: { x: 20, y: 10 }, fixed: false });
        drawBoard.constraintSystem.addGeometry({ id: 'c1', type: 'Point', data: { x: 10, y: 10 }, fixed: false });
        drawBoard.constraintSystem.addGeometry({ id: 'l1', type: 'Line', data: { start: 'p1', end: 'p2' }, fixed: false });
        drawBoard.constraintSystem.addGeometry({ id: 'a1', type: 'Arc', data: { center: 'c1', start: 'p2', end: 'p3', r: 10, startAngle: -Math.PI / 2, endAngle: 0 }, fixed: false });

        const startPoint = new Point(new Vec4(0, 0, 0, 1));
        startPoint.constraintId = 'p1';
        const midPoint = new Point(new Vec4(10, 0, 0, 1));
        midPoint.constraintId = 'p2';
        const endPoint = new Point(new Vec4(20, 10, 0, 1));
        endPoint.constraintId = 'p3';
        const centerPoint = new Point(new Vec4(10, 10, 0, 1));
        centerPoint.constraintId = 'c1';
        const line = new DrawLine(startPoint, midPoint);
        line.constraintId = 'l1';
        const arc = new DrawArc(centerPoint, 10, -Math.PI / 2, 0, midPoint, endPoint);
        arc.constraintId = 'a1';

        drawBoard.drawObjects.push(startPoint, midPoint, endPoint, centerPoint, line, arc);

        assert.ok(startPoint, 'Start point should exist');
        assert.ok(line, 'Line should exist');
        assert.ok(arc, 'Arc should exist');

        camTool.onObjectSelected(startPoint);
        camTool.onObjectSelected(line);
        camTool.onObjectSelected(arc);

        const gcode = camTool.exportSelection();

        assert.equal(
            gcode,
            ['G21', 'G90', 'G17', 'G0 X0 Y0', 'G1 X10 Y0', 'G3 X20 Y10 I0 J10', 'M30'].join('\n')
        );
        assert.equal(camTool.selectedObjects.length, 3);
        assert.equal(drawBoard.selectedObjects.length, 3);
        assert.equal(camTool.lastError, '');
    });
});