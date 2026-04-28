import test, { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { DrawBoard } from "../../src/domain/DrawBoard.js";
import { MouseControl, MouseState } from "../../src/domain/MouseControl.js";
import { Camera, Vec4 } from "../../src/domain/Camera.js";
import { Point } from "../../src/domain/shapes/Point.js";
import { DrawLine } from "../../src/domain/shapes/DrawLine.js";
import { ConstraintSystem } from "../../src/domain/constraints/ConstraintSystem.js";

// Global DOM shim
global.window = {};
global.document = { addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

describe("Phase 3: MouseControl, Selection & Snapping", () => {
    let drawBoard;
    let mockCtx;
    let camera;
    let mouseControl;

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
            measureText: () => ({ width: 10 })
        };
        
        let canvasMock = { width: 800, height: 600, getBoundingClientRect: () => ({ left: 0, top: 0 }), getContext: () => mockCtx };
        camera = new Camera();
        camera.x = 0;
        camera.y = 0;
        camera.zoom = 1;

        drawBoard = new DrawBoard(canvasMock, camera);
        
        // Mock DOM element for mouse control
        const dummyDiv = { addEventListener: () => {} };
        mouseControl = new MouseControl(dummyDiv, drawBoard);
    });

    it("should accurately snap to existing Points within selectDistLampda (10px)", () => {
        // Create a point firmly at world (100, 100)
        let worldPoint = new Point(mockCtx, camera, new Vec4(100, 100, 0, 1));
        drawBoard.drawObjects.push(worldPoint);

        // Simulated screen coordinates (camera is at 0, zoom 1, so 1:1 mapped for ease)
        let missSelection = drawBoard.selectStartObject(80, 80, ["Point"]);
        assert.equal(missSelection.exist, false, "Should not snap when > 10 pixels away");

        let hitSelection = drawBoard.selectStartObject(105, 105, ["Point"]);
        assert.equal(hitSelection.exist, true, "Should snap when exactly within 10px Pythagoras range (sqrt(25+25)=7.07)");
        assert.equal(hitSelection.obj, worldPoint, "Should return the exact object instance");
    });

    it("should filter snapping targets based on the allowedTypes array", () => {
        let worldPoint = new Point(mockCtx, camera, new Vec4(200, 200, 0, 1));
        let P2 = new Point(mockCtx, camera, new Vec4(300, 200, 0, 1));
        let worldLine = new DrawLine(mockCtx, camera, worldPoint, P2);

        drawBoard.drawObjects.push(worldPoint);
        drawBoard.drawObjects.push(worldLine);

        // Click exactly on the Point, but ask ONLY for DrawLines (like the Angle Tool does)
        let hitSelection = drawBoard.selectStartObject(200, 200, ["DrawLine"]);
        assert.equal(hitSelection.exist, true, "Should snap to the line running through exactly this point");
        assert.equal(hitSelection.obj.constructor.name, "DrawLine", "Should ignore the Point and return the Line");
    });

    it("should correctly handle hover states and highlight objects", () => {
        let testPoint = new Point(mockCtx, camera, new Vec4(500, 500, 0, 1));
        testPoint.color = "blue"; // default color
        testPoint.defaultColor = "blue"; // required by hoverObject to revert
        drawBoard.drawObjects.push(testPoint);

        // Hover close
        drawBoard.hoverObject(502, 502);

        // We can just verify the color shifted because mouse interactors check color state logic
        assert.equal(testPoint.color, "green", "Hovering should change object color to green");

        // Hover far away should remove it
        drawBoard.hoverObject(0, 0);
        assert.equal(testPoint.color, "blue", "Hovering away restores original defaultColor");
    });

    it("should dispatch internal state changes cleanly when State machine updates", () => {
        mouseControl.setState(MouseState.LINE);
        assert.equal(mouseControl.buttonState, MouseState.LINE);
        
        let changeCount = 0;
        mouseControl.onStateChange = () => changeCount++;

        mouseControl.setState(MouseState.CIRCLE);
        assert.equal(changeCount, 1, "onStateChange hook should fire when tools switch");
        assert.equal(mouseControl.buttonState, MouseState.CIRCLE);
    });

});