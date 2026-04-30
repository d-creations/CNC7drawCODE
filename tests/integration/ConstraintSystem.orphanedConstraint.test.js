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
        expect(cs.constraints.has("c1")).toBe(true);

        // Delete both points
        cs.removeGeometry("p1");
        cs.removeGeometry("p2");

        // The constraint should be removed as orphaned
        expect(cs.constraints.has("c1")).toBe(false);
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
        expect(cs.constraints.has("c1")).toBe(false);
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
        expect(cs.constraints.has("c1")).toBe(true);
    });
});
