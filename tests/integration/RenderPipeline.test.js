import test, { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { Camera, Vec4 } from "../../src/domain/Camera.js";
import { DrawLine } from "../../src/domain/shapes/DrawLine.js";
import { Point } from "../../src/domain/shapes/Point.js";
import { CanvasRenderer } from "../../src/domain/renderers/CanvasRenderer.js";
import { AppConfig } from "../../src/domain/Config.js";

// Global DOM shim
global.window = {};
global.document = { addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

describe("Phase 4: Render Pipeline & Camera Assertions", () => {
    let mockCtx;
    let camera;

    beforeEach(() => {
        mockCtx = {
            beginPath: mock.fn(),
            moveTo: mock.fn(),
            lineTo: mock.fn(),
            stroke: mock.fn(),
            arc: mock.fn(),
            fill: mock.fn(),
            lineWidth: 1,
            strokeStyle: "rgba(0,0,0,1)",
            fillStyle: "rgba(0,0,0,1)"
        };
        
        // By default, let's keep Config scale/step clean for testing math
        AppConfig.drawBoard.PixelsPerUnit = 1;
        AppConfig.drawBoard.minStep = 1;
        
        camera = new Camera();
    });

    it("should correctly apply standard Panning (move) to World Vectors going to Screen space", () => {
        // Place a point at World (100, 100)
        let point = new Point(mockCtx, camera, new Vec4(100, 100, 0, 1));
        
        // Pan the camera +50x, +20y
        camera.moveX(50);
        camera.moveY(20);

        // When drawn, it must draw at Screen (150, 120) based on Matrix Math
        const renderer = new CanvasRenderer(mockCtx, camera);
        renderer.renderShapes([point]);
        
        // assert that arc was called with (150, 120)
        assert.equal(mockCtx.arc.mock.calls.length, 1, "arc should be called once");
        let drawArgs = mockCtx.arc.mock.calls[0].arguments;
        
        assert.equal(drawArgs[0], 150, "Translated X should be 150");
        assert.equal(drawArgs[1], 120, "Translated Y should be 120");
    });

    it("should correctly apply Zooming (scaling from an origin) to World Vectors", () => {
        let point = new Point(mockCtx, camera, new Vec4(20, 20, 0, 1));
        
        // Zoom by 2x from Screen position (0, 0)
        camera.zoom(2.0, 0, 0); 
        const renderer = new CanvasRenderer(mockCtx, camera);
        renderer.renderShapes([point]);
        
        let drawArgs = mockCtx.arc.mock.calls[0].arguments;
        // A point at World(20, 20) with 2x zoom from 0,0 should appear at Screen(40, 40)
        assert.equal(drawArgs[0], 40, "Zoomed X should be 40");
        assert.equal(drawArgs[1], 40, "Zoomed Y should be 40");
    });

    it("should accurately translate Screen Clicks back to World Coordinates with zoom and pan applied", () => {
        // User pans by -100 in X and Zooms 2x at (0,0)
        camera.moveX(-100);
        camera.zoom(2.0, 0, 0);
        
        // The user clicks at Screen X: 100, Screen Y: 50
        // Because of the 2x scale and initial -100 shift, world math should un-map reliably.
        // matrix[0][3] handles pan after zoom
        let worldVec = camera.getWorldVec(100, 50);
        
        // Expected World: (Screen - TranslationX) / Zoom
        let expectedX = (100 - (-200)) / 2.0; 
        assert.equal(worldVec.x, 150, `World X should be 150, got ${worldVec.x}`);
        assert.equal(worldVec.y, 25, `World Y should be 25 (50 / 2)`);
    });

    it("should draw two connected points as a line with the correct world-to-screen matrix transformations", () => {
        let startPoint = new Point(mockCtx, camera, new Vec4(0, 0, 0, 1));
        let endPoint = new Point(mockCtx, camera, new Vec4(10, 10, 0, 1));

        let drawLine = new DrawLine(mockCtx, camera, startPoint, endPoint);

        // Move camera 5 pixels down
        camera.moveY(5);
        const renderer = new CanvasRenderer(mockCtx, camera);
        renderer.renderShapes([drawLine]);

        // Should call MoveTo then LineTo at Screen coordinates (0, 5) -> (10, 15)
        assert.equal(mockCtx.moveTo.mock.calls.length, 1);
        assert.equal(mockCtx.lineTo.mock.calls.length, 1);
        
        let moveArgs = mockCtx.moveTo.mock.calls[0].arguments;
        let lineArgs = mockCtx.lineTo.mock.calls[0].arguments;

        assert.equal(moveArgs[0], 0);
        assert.equal(moveArgs[1], 5);
        assert.equal(lineArgs[0], 10);
        assert.equal(lineArgs[1], 15);
    });

});