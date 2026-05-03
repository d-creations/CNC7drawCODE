import { GeometricConstraintSolver } from "./GCS.js";
import { DependencyGraph } from "./DependencyGraph.js";

/**
 * @typedef {Object} GeometryPrimitive
 * @property {string} id - Unique identifier (e.g., "point_123", "line_1")
 * @property {string} type - "Point", "Line", "Arc", "Circle"
 * @property {Object} data - Coordinate geometry data
 * @property {boolean} [fixed] - Is this geometry grounded/locked?
 * 
 * Example (Point): { id: "p1", type: "Point", data: { x: 10, y: 20 }, fixed: false }
 * Example (Circle): { id: "c1", type: "Circle", data: { center: "p1", r: 50 }, fixed: false }
 */

/**
 * @typedef {Object} ConstraintDef
 * @property {string} id - Unique identifier
 * @property {string} type - "Coincident", "Horizontal", "Vertical", "Tangent", "Distance"
 * @property {string[]} targets - Geometry IDs involved (e.g. ["p1", "p2"])
 * @property {number} [value] - Required value (distance, angle, radius)
 */

/**
 * @typedef {Object} SketchData
 * @property {GeometryPrimitive[]} geometries - Flat list of basic shapes
 * @property {ConstraintDef[]} constraints - List of rules applied to geometries
 */

/**
 * Core Sketcher System representing a modern Non-Linear CAD constraint solver.
 * Decouples mathematics and storage from the View (Canvas).
 */
export class ConstraintSystem {
    constructor() {
        /** @type {Map<string, GeometryPrimitive>} Storage of standard primitives */
        this.geometries = new Map();
        
        /** @type {Map<string, ConstraintDef>} Storage of mathematical rules */
        this.constraints = new Map();
        
        /** @type {Map<string, string[]>} Adjacency Graph mapping GeometryID -> Connected ConstraintIDs */
        this.graph = new Map();

        /** @type {DependencyGraph} Dependency DAG for lifecycles */
        this.dag = new DependencyGraph();

        /** @type {GeometricConstraintSolver} Math Engine */
        this.gcs = new GeometricConstraintSolver();
    }

    /**
     * Rebuilds the fast-lookup graph used for identifying local "Islands"
     * and the dependency DAG used for lifecycle operations.
     */
    buildGraph() {
        this.graph.clear();

        for (const [id, _] of this.geometries) {
            this.graph.set(id, []);
        }

        // 1. Constraint adjacency graph
        for (const [cId, constraint] of this.constraints) {
            for (const targetId of constraint.targets) {
                if (this.graph.has(targetId)) {
                    this.graph.get(targetId).push(cId);
                }
            }
        }

        // 2. Lifecycle Dependency DAG
        this.dag.build(this.geometries);
    }

    /**
     * Loads a structural JSON representing the CAD drawing.
     * @param {SketchData} sketchData 
     */
    load(sketchData) {
        this.geometries.clear();
        this.constraints.clear();
        
        for (const geo of sketchData.geometries) this.geometries.set(geo.id, geo);
        for (const con of sketchData.constraints) this.constraints.set(con.id, con);
        
        this.buildGraph();
    }

    /**
     * Helper to export back out to Standard JSON schema
     * @returns {SketchData}
     */
    exportJSON() {
        return {
            geometries: Array.from(this.geometries.values()),
            constraints: Array.from(this.constraints.values())
        };
    }

    /**
     * Generates a unique ID and registers new mathematical geometry
     */
    addGeometry(geoConfig) {
        if (!geoConfig.id) {
            geoConfig.id = `${geoConfig.type.toLowerCase()}_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        }
        if (geoConfig.isExplicit === undefined) {
            geoConfig.isExplicit = false; // default to implicit
        }
        this.geometries.set(geoConfig.id, geoConfig);
        this.buildGraph(); // Update adjacency graph
        return geoConfig.id;
    }

    /**
     * Safely removes a geometry and cascades the deletion to fundamental dependents (Lines, Circles) 
     * and connected constraints to prevent orphaned corrupted data.
     * Also performs Garbage Collection on orphaned implicit geometries (like unreferenced endpoints).
     * @param {string} geoId
     * @returns {string[]} Array of all Geometry IDs that were implicitly deleted
     */
    removeGeometry(geoId) {
        if (!this.geometries.has(geoId)) return [];

        let deletedGeoIds = this.dag.getDeletionList(geoId, this.geometries, this.graph, this.constraints);

        // Action 1: Remove all affected geometries
        for (let delId of deletedGeoIds) {
            this.geometries.delete(delId);
        }

        // Action 2: Remove any constraints that referenced any of the deleted geometries
        let constraintsToDelete = [];
        for (let [cId, constraint] of this.constraints) {
            if (constraint.targets.some(t => deletedGeoIds.has(t))) {
                constraintsToDelete.push(cId);
            }
        }
        for (let cId of constraintsToDelete) {
            this.constraints.delete(cId);
        }

        // Action 3: Remove structurally orphaned constraints (targets entirely missing)
        let orphanedConstraints = [];
        for (let [cId, constraint] of this.constraints) {
            if (constraint.targets.every(t => !this.geometries.has(t))) {
                orphanedConstraints.push(cId);
            }
        }
        for (let cId of orphanedConstraints) {
            this.constraints.delete(cId);
        }

        this.buildGraph();
        return Array.from(deletedGeoIds);
    }

    /**
     * Generates a unique ID and registers a new rule
     */
    addConstraint(conConfig) {
        if (!conConfig.id) {
            conConfig.id = `constraint_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        }
        this.constraints.set(conConfig.id, conConfig);
        this.buildGraph();
        this.solveLocal(conConfig.targets[0], false); // Force a snap resolve
        return conConfig.id;
    }

    // =======================================================================
    // REAL-TIME SOLVER ENGINE (Local & Global)
    // =======================================================================

    /**
     * Main entry point when a user drags a point.
     * Solves ONLY the constraint "Island" linked to this point.
     * @param {string} draggedGeoId - The ID of the geometry the user is moving
     * @param {boolean} isDragging - True = Fast approx (60fps), False = Strict final solve
     */
    solveLocal(draggedGeoId, isDragging = false) {
        // 1. Traverse Graph to find connected "Island" of geometry
        let { activeGeoms, activeConstraints, travelDistances } = this.extractIsland(draggedGeoId);
        if (activeConstraints.length === 0) return; // Point is free-floating

        // 2. Set Iteration Limits
        // Fast dragging needs only a few iterations to "pull" the geometry.
        // Dropping the mouse allocates many iterations for extreme precision.
        let maxIterations = isDragging ? 8 : 200;

        // 3. Hand off to the Geometric Constraint Solver (GCS)
        this.gcs.solveIsland(activeGeoms, activeConstraints, maxIterations, travelDistances);
    }

    /**
     * BFS Graph Traversal to find only objects constrained to the dragged target.
     * Keeps calculations fast (O(k)) regardless of the total drawing size (O(n)).
     */
    extractIsland(startId) {
        let visitedGeoms = new Set([startId]);
        let activeConstraints = new Set();
        let queue = [startId];
        let travelDistances = new Map();
        travelDistances.set(startId, 0);

        while (queue.length > 0) {
            let currentGeo = queue.shift();
            let currentDist = travelDistances.get(currentGeo);
            let connectedConstraints = this.graph.get(currentGeo) || [];

            for (const cId of connectedConstraints) {
                if (activeConstraints.has(cId)) continue;
                activeConstraints.add(cId);

                let constraint = this.constraints.get(cId);
                for (const targetId of constraint.targets) {
                    if (!visitedGeoms.has(targetId)) {
                        visitedGeoms.add(targetId);
                        travelDistances.set(targetId, currentDist + 1);
                        queue.push(targetId);
                    }
                }
            }

            // Also traverse structural dependencies (e.g. from Point to Line, or Line to Point)
            let node = this.dag.nodes.get(currentGeo);
            if (node) {
                // If a point moves, the line moves
                for (let dep of node.dependents) {
                    if (!visitedGeoms.has(dep)) {
                        visitedGeoms.add(dep);
                        travelDistances.set(dep, currentDist + 1);
                        queue.push(dep);
                    }
                }
                // If a line is somehow targeted, its points must be included for math
                for (let req of node.dependencies) {
                    if (!visitedGeoms.has(req)) {
                        visitedGeoms.add(req);
                        travelDistances.set(req, currentDist + 1);
                        queue.push(req);
                    }
                }
            }
        }

        return {
            activeGeoms: Array.from(visitedGeoms).map(id => this.geometries.get(id)),
            activeConstraints: Array.from(activeConstraints).map(id => this.constraints.get(id)),
            travelDistances: travelDistances
        };
    }
}
