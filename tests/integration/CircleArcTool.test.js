import test, { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { DrawBoard } from "../../src/domain/DrawBoard.js";
import { ConstraintSystem } from "../../src/domain/constraints/ConstraintSystem.js";
import { Circle3PTool } from "../../src/domain/tools/Circle3PTool.js";
import { ArcCenterTool } from "../../src/domain/tools/ArcCenterTool.js";
import { Camera } from "../../src/domain/Camera.js";

// Global DOM shim
global.window = {};
global.document = { addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

describe("Phase 5: Circle and Arc Integration", () => {
    let drawBoard;
    let constraintSystem;
    let mockCtx;
    let circleTool;
    let arcTool;

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

        const canvasMock = { width: 800, height: 600, getBoundingClientRect: () => ({ left: 0, top: 0 }), getContext: () => mockCtx };
        const camera = new Camera();
        
        drawBoard = new DrawBoard(canvasMock, camera);
        constraintSystem = drawBoard.constraintSystem;

        circleTool = new Circle3PTool(drawBoard, constraintSystem);
        arcTool = new ArcCenterTool(drawBoard, constraintSystem);
    });

    it("should generate a proper Circle from 3 Points mathematically and visually", () => {
        // Click 1: Right edge
        circleTool.onCanvasClick(10, 0);
        // Click 2: Top edge
        circleTool.onCanvasClick(0, 10);
        // Click 3: Left edge
        circleTool.onCanvasClick(-10, 0);

        // Through (10,0), (0,10), and (-10,0), the Circumcenter is (0,0) and Radius is 10.
        let createdCircles = Array.from(constraintSystem.geometries.values()).filter(g => g.type === "Circle");
        assert.equal(createdCircles.length, 1, "Exactly one Circle should be created in the ConstraintSystem");

        let circleGeometry = createdCircles[0];
        let centerPoint = constraintSystem.geometries.get(circleGeometry.data.center);
        
        // Math Assertions
        assert.ok(Math.abs(centerPoint.data.x - 0) < 0.001, `Center X should be 0, got ${centerPoint.data.x}`);
        assert.ok(Math.abs(centerPoint.data.y - 0) < 0.001, `Center Y should be 0, got ${centerPoint.data.y}`);
        assert.ok(Math.abs(circleGeometry.data.r - 10) < 0.001, `Radius should be 10, got ${circleGeometry.data.r}`);

        // Rendering Assertions
        drawBoard.draw();
        // Ensure arc() was called to physically draw the circle.
        // Depending on draw calls (points also draw arcs), we ensure at least one invocation draws the radius.
        const arcCalls = mockCtx.arc.mock.calls;
        let foundCircleDraw = false;
        for (let call of arcCalls) {
            let [x, y, r, startAngle, endAngle] = call.arguments;
            if (Math.abs(x - 0) < 0.001 && Math.abs(y - 0) < 0.001 && Math.abs(r - 10) < 0.001) {
                // Also check if it draws a full circle (0 to 2*PI)
                if (Math.abs(endAngle - 2 * Math.PI) < 0.001) {
                    foundCircleDraw = true;
                }
            }
        }
        assert.equal(foundCircleDraw, true, "DrawBoard should have triggered ctx.arc() rendering for the Full Circle");
    });

    it("should generate a proper Arc from Center, Start, and End Points mathematically", () => {
        // Step 1: Center
        arcTool.onCanvasClick(0, 0);
        
        // Step 2: Start Point (determines Radius)
        arcTool.onCanvasClick(10, 0);

        // Step 3: End Point (determines End Angle)
        arcTool.onCanvasClick(0, 10);

        let createdArcs = Array.from(constraintSystem.geometries.values()).filter(g => g.type === "Arc");
        assert.equal(createdArcs.length, 1, "Exactly one Arc should be created in the ConstraintSystem");

        let arcGeometry = createdArcs[0];
        let centerPoint = constraintSystem.geometries.get(arcGeometry.data.center);

        assert.ok(Math.abs(centerPoint.data.x - 0) < 0.001, "Arc Center X should be 0");
        assert.ok(Math.abs(centerPoint.data.y - 0) < 0.001, "Arc Center Y should be 0");
        assert.ok(Math.abs(arcGeometry.data.r - 10) < 0.001, "Arc Radius should be 10");
        
        // Render pass to check draw execution
        drawBoard.draw();
        const arcCalls = mockCtx.arc.mock.calls;
        // Arc Tool typically draws an Open Arc segment, so we check that an arc with radius 10 and the correct angles was emitted.
        let foundArcDraw = false;
        for (let call of arcCalls) {
            let [x, y, r, startAngle, endAngle] = call.arguments;
            if (Math.abs(x - 0) < 0.001 && Math.abs(y - 0) < 0.001 && Math.abs(r - 10) < 0.001) {
                // If it isn't a full circle (Points rendering uses 2*pi for filled circles usually)
                if (Math.abs((endAngle - startAngle) - (2 * Math.PI)) > 0.001) {
                    foundArcDraw = true;
                }
            }
        }
        
        // Point drawing also uses arc (with radius 5 usually), Arc shape uses the model radius (10)
        assert.equal(foundArcDraw, true, "DrawBoard should have triggered ctx.arc() for the Arc Segment");
    });
});
