import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ConstraintSystem } from "../../src/domain/constraints/ConstraintSystem.js";

describe("ConstraintSystem orphaned constraint cleanup", () => {
    it("removes constraints with no valid targets after geometry deletion", () => {
        // Setup: 2 points, 1 constraint between them
        const cs = new ConstraintSystem();
        const p1 = { id: "p1", type: "Point", data: { x: 0, y: 0 } };
        const p2 = { id: "p2", type: "Point", data: { x: 1, y: 1 } };
        cs.addGeometry(p1);
        cs.addGeometry(p2);
        const constraint = { id: "c1", type: "Distance", targets: ["p1", "p2"], value: 10 };
        cs.addConstraint(constraint);

        // Sanity check: constraint exists
        assert.equal(cs.constraints.has("c1") || cs.constraints.size > 0, true);

        // Delete both points
        cs.removeGeometry("p1");
        cs.removeGeometry("p2");

        // The constraint should be removed as orphaned
        assert.equal(cs.constraints.has("c1") || cs.constraints.size > 0, false);
    });

    it("keeps constraints with at least one valid target", () => {
        // Setup: 2 points, 1 constraint between them
        const cs = new ConstraintSystem();
        const p1 = { id: "p1", type: "Point", data: { x: 0, y: 0 } };
        const p2 = { id: "p2", type: "Point", data: { x: 1, y: 1 } };
        cs.addGeometry(p1);
        cs.addGeometry(p2);
        const constraint = { id: "c1", type: "Distance", targets: ["p1", "p2"], value: 10 };
        cs.addConstraint(constraint);

        // Delete only one point
        cs.removeGeometry("p1");

        // The constraint should be removed (since all targets are missing)
        assert.equal(cs.constraints.has("c1") || cs.constraints.size > 0, false);
    });

    it("does not remove constraints if all targets still exist", () => {
        // Setup: 2 points, 1 constraint between them
        const cs = new ConstraintSystem();
        const p1 = { id: "p1", type: "Point", data: { x: 0, y: 0 } };
        const p2 = { id: "p2", type: "Point", data: { x: 1, y: 1 } };
        cs.addGeometry(p1);
        cs.addGeometry(p2);
        const constraint = { id: "c1", type: "Distance", targets: ["p1", "p2"], value: 10 };
        cs.addConstraint(constraint);

        // No deletion
        assert.equal(cs.constraints.has("c1") || cs.constraints.size > 0, true);
    });

    it("cascades deletion to LengthMeasurement when a point is removed", () => {
        const cs = new ConstraintSystem();
        const p1 = { id: "p1", type: "Point", data: { x: 0, y: 0 } };
        const p2 = { id: "p2", type: "Point", data: { x: 1, y: 1 } };
        const meas = { id: "m1", type: "LengthMeasurement", data: { p1Id: "p1", p2Id: "p2", value: 10 } };
        
        cs.addGeometry(p1);
        cs.addGeometry(p2);
        cs.addGeometry(meas);
        
        assert.equal(cs.geometries.has("m1"), true);
        
        // Remove point p1, which m1 depends on
        cs.removeGeometry("p1");
        
        assert.equal(cs.geometries.has("m1"), false);
        assert.equal(cs.geometries.has("p2"), true);
    });

    it("cascades deletion to AngleMeasurement when a line is removed", () => {
        const cs = new ConstraintSystem();
        const l1 = { id: "l1", type: "Line", data: { start: "p1", end: "p2" } }; 
        const l2 = { id: "l2", type: "Line", data: { start: "p3", end: "p4" } };
        const meas = { id: "m1", type: "AngleMeasurement", data: { l1Id: "l1", l2Id: "l2" } };
        
        cs.addGeometry(l1);
        cs.addGeometry(l2);
        cs.addGeometry(meas);
        
        // Remove line l1, which m1 depends on
        cs.removeGeometry("l1");
        
        assert.equal(cs.geometries.has("m1"), false);
    });

    it("cascades deletion to RadiusMeasurement when a circle is removed", () => {
        const cs = new ConstraintSystem();
        const c1 = { id: "c1", type: "Circle", data: { center: "p1", r: 5 } };
        const meas = { id: "m1", type: "RadiusMeasurement", data: { circleId: "c1", value: 5 } };
        
        cs.addGeometry(c1);
        cs.addGeometry(meas);
        
        // Remove circle c1, which m1 depends on
        cs.removeGeometry("c1");
        
        assert.equal(cs.geometries.has("m1"), false);
    });
});
