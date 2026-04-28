import test, { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { DrawBoard } from "../../src/domain/DrawBoard.js";
import { LengthMeasurementTool } from "../../src/domain/tools/LengthMeasurementTool.js";
import { Camera } from "../../src/domain/Camera.js";

// Global DOM shim
global.window = {};
global.document = { addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

describe("Phase 6: Measurement Tools Integration", () => {
    let drawBoard;
    let constraintSystem;
    let mockCtx;
    let lengthTool;

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
    });

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
});
