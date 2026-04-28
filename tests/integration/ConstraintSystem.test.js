import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { ConstraintSystem } from "../../src/domain/constraints/ConstraintSystem.js";
import { DrawBoard } from "../../src/domain/DrawBoard.js";
import { Camera } from "../../src/domain/Camera.js";

// Basic global DOM environment shim
global.window = {};
global.document = { addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

describe("Phase 2: Constraint System & Solver Integration", () => {
    let constraintSystem;

    beforeEach(() => {
        constraintSystem = new ConstraintSystem();
    });

    it("should solve a Horizontal constraint between two points", () => {
        // 1. Add Geometry
        let p1Id = constraintSystem.addGeometry({ type: "Point", data: { x: 10, y: 10 }, fixed: true }); // Lock P1
        let p2Id = constraintSystem.addGeometry({ type: "Point", data: { x: 50, y: 30 }, fixed: false });
        
        // 2. Add Horizontal Constraint (y2 must equal y1)
        constraintSystem.addConstraint({
            type: "Horizontal",
            targets: [p1Id, p2Id]
        });

        // The system automatically attempts a local solve on addConstraint.
        // Let's verify the updated coordinate of P2.
        let p2Data = constraintSystem.geometries.get(p2Id).data;
        
        // Since p1 is fixed at y:10, and it's a Horizontal relation, p2's y should become 10.
        assert.ok(Math.abs(p2Data.y - 10) < 0.001, `p2.y should be horizontally aligned to 10, got ${p2Data.y}`);
    });

    it("should solve a Distance constraint between two points", () => {
        // 1. Add Geometry
        let p1Id = constraintSystem.addGeometry({ type: "Point", data: { x: 0, y: 0 }, fixed: true });
        let p2Id = constraintSystem.addGeometry({ type: "Point", data: { x: 30, y: 0 }, fixed: false }); // Initial distance = 30
        
        // 2. Add Distance Constraint to force distance to 50
        constraintSystem.addConstraint({
            type: "Distance",
            targets: [p1Id, p2Id],
            value: 50
        });

        let p2Data = constraintSystem.geometries.get(p2Id).data;
        
        // By Newton Raphson, since p2 is already at y=0, it should just slide along X to x=50.
        let distance = Math.sqrt(Math.pow(p2Data.x - 0, 2) + Math.pow(p2Data.y - 0, 2));
        assert.ok(Math.abs(distance - 50) < 0.001, `Distance should be 50, got ${distance}`);
    });

    it("should properly update Visual rendering coordinates gracefully", () => {
        // Here we test when the constraint system updates, how visual shapes pull back their coordinates in DrawBoard
        const mockCtx = {
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            beginPath: () => {},
            strokeRect: () => {},
            clearRect: () => {},
            fillText: () => {},
            fillRect: () => {},
            save: () => {},
            restore: () => {},
            arc: () => {},
            fill: () => {},
            measureText: () => ({ width: 10 })
        };
        const camera = new Camera();
        let canvasMock = { width: 800, height: 600, getBoundingClientRect: () => ({ left: 0, top: 0 }), getContext: () => mockCtx };

        let drawBoard = new DrawBoard(canvasMock, camera);
        let cs = drawBoard.constraintSystem;

        // Create some geometries directly inside DrawBoard 
        let p1Id = cs.addGeometry({ type: "Point", data: { x: 0, y: 0 } });
        let p2Id = cs.addGeometry({ type: "Point", data: { x: 20, y: 30 } });
        cs.addGeometry({ type: "Line", data: { start: p1Id, end: p2Id } });

        // Force a Horizontal solver shift
        cs.addConstraint({ type: "Horizontal", targets: [p1Id, p2Id] });
        
        // Ensure that when draw is called, it does not throw (DrawLine coordinates exist)
        assert.doesNotThrow(() => {
            drawBoard.draw();
        });
        
        let p2Data = cs.geometries.get(p2Id).data;
        let p1Data = cs.geometries.get(p1Id).data;
        // P1 and P2 should now have exactly the same Y
        assert.ok(Math.abs(p1Data.y - p2Data.y) < 0.001, "DrawBoard's inner points didn't solve properly");
    });
});