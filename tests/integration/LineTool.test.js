import test, { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { DrawBoard } from "../../src/domain/DrawBoard.js";
import { ConstraintSystem } from "../../src/domain/constraints/ConstraintSystem.js";
import { LineTool } from "../../src/domain/tools/LineTool.js";
import { Camera } from "../../src/domain/Camera.js";

// Basic global DOM environment shim (if DrawBoard/Camera access window)
global.window = {};
global.document = {
    addEventListener: () => {}
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

describe("Line Drawing Integration", () => {
    let drawBoard;
    let constraintSystem;
    let lineTool;
    let mockCtx;

    beforeEach(() => {
        // Create mocked functions using Node's native mock.fn()
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

        // Ensure Camera is minimal and mocked 
        const camera = new Camera();
        
        let canvasMock = {
            width: 800,
            height: 600,
            getBoundingClientRect: () => ({ left: 0, top: 0 }),
            getContext: () => mockCtx
        };

        // Instantiate core system accurately
        drawBoard = new DrawBoard(canvasMock, camera);
        
        constraintSystem = new ConstraintSystem();
        drawBoard.constraintSystem = constraintSystem;

        lineTool = new LineTool(drawBoard, constraintSystem);
    });

    it("should call the canvas moveTo and lineTo commands when drawn", () => {
        // Simulate clicks to draw a line
        lineTool.onCanvasClick(10, 10);
        lineTool.onCanvasClick(50, 50);

        // Verify state changes directly
        // Ensure we created some geometry inside the system
        assert.equal(drawBoard.drawObjects.length > 0, true, "DrawBoard should have visual objects stored");
        
        // Force a draw call to test rendering logic
        drawBoard.draw();

        // Use Node's mock API to verify the canvas methods were called
        // .mock.callCount() contains the number of invocations
        assert.equal(mockCtx.moveTo.mock.calls.length >= 1, true, "moveTo should have been called");
        assert.equal(mockCtx.lineTo.mock.calls.length >= 1, true, "lineTo should have been called");
        assert.equal(mockCtx.stroke.mock.calls.length >= 1, true, "stroke should have been called");
    });
});
