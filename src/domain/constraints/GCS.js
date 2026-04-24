import { BaseNonLinearSolver } from "../math/solvers/BaseNonLinearSolver.js";

/**
 * Geometric Constraint Solver (GCS)
 * Handles Degrees of Freedom (DOF) tracking and the Non-Linear Newton-Raphson solver matrix.
 */
export class GeometricConstraintSolver extends BaseNonLinearSolver {
    constructor() {
        super();
    }

    /**
     * Estimates Degrees of Freedom (DOF) for a given island of geometry.
     * Each 2D Point adds 2 DOF.
     * Each distance constraint removes 1 DOF.
     * @param {Array} geometries
     * @param {Array} constraints
     * @returns {number} The current DOF count
     */
    calculateDOF(geometries, constraints) {
        let dof = 0;
        for (let geo of geometries) {
            if (geo.fixed) continue;
            if (geo.type === "Point") dof += 2;
            if (geo.type === "Circle") dof += 1; // Radius
            if (geo.type === "Arc") dof += 3; // r, startAngle, endAngle
        }

        // Remove DOF for constraints
        for (let c of constraints) {
            if (c.type === "Distance") dof -= 1;
            if (c.type === "Horizontal" || c.type === "Vertical") dof -= 1;
            if (c.type === "Coincident") dof -= 2;
            if (c.type === "LengthMeasurement") dof -= 1;
            if (c.type === "AngleMeasurement") dof -= 1;
            if (c.type === "RadiusMeasurement") dof -= 1;
        }

        return dof;
    }

    /**
     * Takes an island of geometries and constraints and runs a Newton-Raphson iteration.
     * @param {Array} geometries - Geometries to morph
     * @param {Array} constraints - Active numerical constraints
     * @param {number} maxIter - Iteration limit
     */
    solveIsland(geometries, constraints, maxIter = 100, travelDistances = null) {
        // 3. Under/Over-Constrained Conflict Detection
        // Let's log the DOF to console as a diagnostic metric!
        const dof = this.calculateDOF(geometries, constraints);
        if (dof < 0) {
            console.warn(`[GCS] Warning: Sketch island is over-constrained! (DOF: ${dof})`);
            // We no longer abort here! Damped Least-Squares can solve over-constrained systems.
        }
        console.log(`[GCS] Solving Island: ${geometries.length} geometries, ${constraints.length} rules, DOF: ${dof}`);
        console.log(`[GCS] Active Rules types:`, constraints.map(c => c.type));

        let { state, stateMap, weights } = this.extractStateVector(geometries, constraints, travelDistances);
        if (state.length === 0) {
            console.log(`[GCS] No moving parts found. Skipping solve.`);
            return; // Nothing to solve
        }

        console.log(`[GCS] Mapped ${state.length} variables to the matrix.`);

        // Delegate to the pure mathematics base solver loop
        const errorFunc = (testState) => this.evaluateError(geometries, testState, stateMap, constraints);
        state = this.solveSystem(state, errorFunc, maxIter, weights);

        this.applyStateVector(geometries, state, stateMap);
    }

    // =======================================================================
    // REAL-DOMAIN MAPPING (JSON -> Matrix)
    // =======================================================================

    extractStateVector(geometries, constraints, travelDistances) {
        let state = [];
        let stateMap = [];
        let weights = [];

        // 2. Directed Bipartite Graphs (Dependency Trees)
        // Tally up constraints for each geometry
        let constraintCount = {};
        for (let c of constraints) {
            if (!c.targets) continue;
            for (let target of c.targets) {
                constraintCount[target] = (constraintCount[target] || 0) + 1;
            }
        }

        for (const geo of geometries) {
            // Grounded / Fixed Items: Cannot move. (0 DOF)
            if (geo.fixed) continue; 

            // 1. Topographic Anchoring via Weights
            // Points closer to the user interaction (travelDistances === 0) have weight 1 (easy to move)
            // Points further down the Graph (travelDistances >= 2) become exponentially heavier.
            let dist = travelDistances ? (travelDistances.get(geo.id) || 0) : 0;
            // E.g., user drag focus -> 1, next adjacent point -> 10, next -> 100
            let weight = Math.pow(10, dist);

            if (geo.type === "Point") {
                stateMap.push({ obj: geo, prop: "x" }); state.push(geo.data.x); weights.push(weight);
                stateMap.push({ obj: geo, prop: "y" }); state.push(geo.data.y); weights.push(weight);
            } else if (geo.type === "Circle") {
                stateMap.push({ obj: geo, prop: "r" }); state.push(geo.data.r); weights.push(weight);
            } else if (geo.type === "Arc") {
                stateMap.push({ obj: geo, prop: "r" }); state.push(geo.data.r); weights.push(weight);
                stateMap.push({ obj: geo, prop: "startAngle" }); state.push(geo.data.startAngle); weights.push(weight);
                stateMap.push({ obj: geo, prop: "endAngle" }); state.push(geo.data.endAngle); weights.push(weight);
            }
        }
        return { state, stateMap, weights };
    }

    applyStateVector(geometries, state, stateMap) {
        for (let i = 0; i < state.length; i++) {
            let mapping = stateMap[i];
            mapping.obj.data[mapping.prop] = state[i];
        }
    }

    evaluateError(geometries, state, stateMap, activeConstraints) {
        // Quick virtual apply
        let backup = [];
        for (let i = 0; i < state.length; i++) {
            let m = stateMap[i];
            backup.push(m.obj.data[m.prop]);
            m.obj.data[m.prop] = state[i];
        }

        // Calculate errors
        let F = activeConstraints.map(c => {
            if (c.type === "Horizontal") {
                let p1 = geometries.find(g => g.id === c.targets[0])?.data;
                let p2 = geometries.find(g => g.id === c.targets[1])?.data;
                if(p1 && p2) return p1.y - p2.y;
            }
            if (c.type === "Distance" || c.type === "LengthMeasurement") {
                // If it's the actual property LengthMeasurement from the app, it usually stores value in c.value or targets
                let p1 = geometries.find(g => g.id === c.targets[0])?.data;
                let p2 = geometries.find(g => g.id === c.targets[1])?.data;
                if(p1 && p2 && c.value !== undefined){
                    let dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                    return dist - c.value;
                }
            }
            if (c.type === "RadiusMeasurement") {
                let circ = geometries.find(g => g.id === c.targets[0])?.data;
                if (!circ) console.warn("RadiusMeasurement constraint missing target! targets:", c.targets);
                // For a circle constraint, extracting state map gets the radius variable. But some constraints targets might be shapes,
                // and the RadiusMeasurement logic expects a point id, 
                // Wait! c.targets[0] is the circle's Constraint ID!
                if (circ && c.value !== undefined) {
                    console.log(`[EvalError] RadiusMeasurement: circ.r=${circ.r}, target value=${c.value}, error=${circ.r - c.value}`);
                    return circ.r - c.value;
                }
            }
            if (c.type === "AngleMeasurement") {
                let p1s = geometries.find(g => g.id === c.targets[0])?.data;
                let p1e = geometries.find(g => g.id === c.targets[1])?.data;
                let p2s = geometries.find(g => g.id === c.targets[2])?.data;
                let p2e = geometries.find(g => g.id === c.targets[3])?.data;
                
                if (p1s && p1e && p2s && p2e && c.value !== undefined) {
                    let a1 = Math.atan2(p1e.y - p1s.y, p1e.x - p1s.x);
                    let a2 = Math.atan2(p2e.y - p2s.y, p2e.x - p2s.x);
                    let diff = a2 - a1;
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    while (diff < -Math.PI) diff += 2 * Math.PI;
                    return Math.abs(diff) - c.value;
                }
            }
            return 0; // Unhandled
        });

        // Restore backup
        for (let i = 0; i < state.length; i++) {
            let m = stateMap[i];
            m.obj.data[m.prop] = backup[i];
        }

        return F;
    }
}
