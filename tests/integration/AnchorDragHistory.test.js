import test, { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { DrawBoard } from '../../src/domain/core/DrawBoard.js';
import { MouseControl, MouseState } from '../../src/domain/viewController/MouseControl.js';
import { HistoryManager } from "../../src/domain/storage/HistoryManager.js";
import { LocalSketchStorage } from "../../src/domain/storage/LocalSketchStorage.js";
import { LengthMeasurementTool } from "../../src/domain/tools/LengthMeasurementTool.js";
import { Camera } from '../../src/domain/viewController/Camera.js';

// Global DOM shim
global.window = {};
global.document = { addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

describe("Measurement Anchor Drag and History Integration", () => {
    let drawBoard;
    let mockCtx;
    
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
            measureText: () => ({ width: 10 }),
            setLineDash: mock.fn()
        };
        
        let canvasMock = { width: 800, height: 600, getBoundingClientRect: () => ({ left: 0, top: 0 }), getContext: () => mockCtx };
        let camera = new Camera();
        drawBoard = new DrawBoard(canvasMock, camera);
        
        // Mock DOM element for mouse control
        const dummyDiv = { addEventListener: () => {} };
        drawBoard.mouseControl = new MouseControl(dummyDiv, drawBoard);
        
        // Initialize storage and history with mocks to avoid fs operations
        let baseStorage = new LocalSketchStorage(drawBoard);
        baseStorage.saveSketch = mock.fn();
        drawBoard.historyManager = new HistoryManager(baseStorage);
        drawBoard.storage = drawBoard.historyManager;
        
        drawBoard.saveState();
    });

    it("should allow dragging a measurement anchor, sync it to geo data, and support undo/redo", () => {
        // Setup a measurement using the tool to ensure exact valid states
        const lengthTool = new LengthMeasurementTool(drawBoard);
        
        // P1
        lengthTool.onCanvasClick(100, 100);
        // Move to generate temporary shape
        lengthTool.onMouseMove(150, 100);
        // P2
        lengthTool.onCanvasClick(200, 100);
        
        // Find the measurement shape
        const shape = drawBoard.drawObjects.find(s => s.isMeasurement);
        assert.ok(shape, "Measurement shape should be in draw objects");
        
        const measureId = shape.constraintId;

        // Save state before drag
        drawBoard.saveState();
        
        // Verify no textAnchor is set yet (undefined or null)
        assert.ok(!shape.textAnchor, "Should not have explicit text anchor initially");

        // Simulate dragging the measurement
        drawBoard.mouseControl.buttonState = MouseState.SELECT;
        drawBoard.mouseControl.activeDragItem = shape;
        drawBoard.mouseControl.mousePressed = true; // Needed to trigger dragging logic

        // Move to new location
        let targetX = 150, targetY = 150;
        // In MouseControl, dragging modifies the shape's anchor and calls syncToGeoData natively via mouseMove
        drawBoard.mouseControl.mousePosition = {x: 100, y: 100}; // initial
        drawBoard.mouseControl.mouseMove({ x: targetX, y: targetY });

        // Check if the shape anchor has moved
        const expectedWorldPos = drawBoard.camera.getWorldVec(targetX, targetY);
        assert.ok(shape.textAnchor, "Text anchor should be set");
        assert.equal(shape.textAnchor.x, expectedWorldPos.x);
        assert.equal(shape.textAnchor.y, expectedWorldPos.y);

        // Mouse up saves state
        drawBoard.mouseControl.mouseUp({ x: targetX, y: targetY });
        
        // Verify the constraint system got the data
        const geo = drawBoard.constraintSystem.geometries.get(measureId);
        assert.ok(geo.data.textAnchor, "Constraint system geo data should have textAnchor");
        assert.equal(geo.data.textAnchor.x, expectedWorldPos.x);

        // Perform UNDO
        drawBoard.undo();

        const shapeAfterUndo = drawBoard.drawObjects.find(s => s.constraintId === measureId);
        assert.ok(!shapeAfterUndo.textAnchor, "Text anchor should be reverted after undo");
        const geoAfterUndo = drawBoard.constraintSystem.geometries.get(measureId);
        assert.ok(!geoAfterUndo.data.textAnchor, "Geo data should be reverted after undo");

        // Perform REDO
        drawBoard.redo();
        
        const shapeAfterRedo = drawBoard.drawObjects.find(s => s.constraintId === measureId);
        assert.ok(shapeAfterRedo.textAnchor, "Text anchor should be restored after redo");
        assert.equal(shapeAfterRedo.textAnchor.x, expectedWorldPos.x);
    });
});
