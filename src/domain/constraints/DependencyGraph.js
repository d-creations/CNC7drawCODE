/** DAG system for managing geometry dependencies */

export class DependencyGraph {
    constructor() {
        /** @type {Map<string, { dependencies: Set<string>, dependents: Set<string> }>} */
        this.nodes = new Map();
    }

    /**
     * Gets IDs of geometries that the given geometry depends upon (e.g. Line -> Points).
     * @param {Object} geo 
     * @returns {string[]} List of geometry IDs.
     */
    static getDependencies(geo) {
        if (!geo || !geo.data) return [];
        let deps = [];
        if (geo.type === "Line") {
            if (geo.data.start) deps.push(geo.data.start);
            if (geo.data.end) deps.push(geo.data.end);
        } else if (geo.type === "Circle") {
            if (geo.data.center) deps.push(geo.data.center);
        } else if (geo.type === "Arc") {
            if (geo.data.center) deps.push(geo.data.center);
            if (geo.data.start) deps.push(geo.data.start);
            if (geo.data.end) deps.push(geo.data.end);
        } else if (geo.type === "AngleMeasurement") {
            if (geo.data.l1Id) deps.push(geo.data.l1Id);
            if (geo.data.l2Id) deps.push(geo.data.l2Id);
        } else if (["LengthMeasurement", "VerticalMeasurement", "HorizontalMeasurement"].includes(geo.type)) {
            if (geo.data.p1Id) deps.push(geo.data.p1Id);
            if (geo.data.p2Id) deps.push(geo.data.p2Id);
        } else if (geo.type === "RadiusMeasurement") {
            if (geo.data.circleId) deps.push(geo.data.circleId);
        }
        return deps;
    }

    /**
     * Rebuilds the lifecycle dependency DAG
     * @param {Map<string, Object>} geometries 
     */
    build(geometries) {
        this.nodes.clear();
        for (const [id, _] of geometries) {
            this.nodes.set(id, { dependencies: new Set(), dependents: new Set() });
        }

        for (const [id, geo] of geometries) {
            let deps = DependencyGraph.getDependencies(geo);
            for (let depId of deps) {
                if (this.nodes.has(depId)) {
                    this.nodes.get(id).dependencies.add(depId);
                    this.nodes.get(depId).dependents.add(id);
                }
            }
        }
    }

    /**
     * Computes the full list of geometries to delete when a source geometry is removed.
     * Handles both upward cascade (deleting dependents) and downward Garbage Collection (removing newly unreferenced implicit points).
     * @param {string} sourceGeoId 
     * @param {Map<string, Object>} geometries 
     * @param {Map<string, string[]>} constraintGraph - Maps geoId to constraintIds
     * @param {Map<string, Object>} constraints - All constraints
     * @returns {Set<string>}
     */
    getDeletionList(sourceGeoId, geometries, constraintGraph, constraints) {
        let deletedGeoIds = new Set([sourceGeoId]);
        let queue = [sourceGeoId];

        // Phase 1: Upward Cascade (If I delete a Point, I must delete all Lines attached to it)
        while (queue.length > 0) {
            let currentId = queue.shift();
            let node = this.nodes.get(currentId);
            if (node) {
                for (let dependentId of node.dependents) {
                    if (!deletedGeoIds.has(dependentId)) {
                        deletedGeoIds.add(dependentId);
                        queue.push(dependentId);
                    }
                }
            }
        }

        // Phase 2: Downward Garbage Collection (Orphaned implicit points check)
        let orphansToCheck = new Set();
        for (let delId of deletedGeoIds) {
            let node = this.nodes.get(delId);
            if (node) {
                for (let depId of node.dependencies) {
                    if (!deletedGeoIds.has(depId)) {
                        orphansToCheck.add(depId);
                    }
                }
            }
        }

        let gcQueue = Array.from(orphansToCheck);
        while (gcQueue.length > 0) {
            let checkId = gcQueue.shift();
            let checkGeo = geometries.get(checkId);
            if (!checkGeo || checkGeo.isExplicit) continue; // Do not GC explicit user-placed points

            // Count how many ACTIVE dependents this node has
            let node = this.nodes.get(checkId);
            let activeDependentsCount = 0;
            if (node) {
                for (let d of node.dependents) {
                    if (!deletedGeoIds.has(d)) {
                        activeDependentsCount++;
                    }
                }
            }

            // Count active constraints
            let activeConstraintsCount = 0;
            let constraintIds = constraintGraph.get(checkId) || [];
            for (let cId of constraintIds) {
                let currentConstraint = constraints.get(cId);
                if (!currentConstraint) continue;
                let isDeleted = currentConstraint.targets.some(t => deletedGeoIds.has(t));
                if (!isDeleted) {
                    activeConstraintsCount++;
                }
            }

            if (activeDependentsCount === 0 && activeConstraintsCount === 0) {
                // Orphaned! Add to deleted and check ITS dependencies
                deletedGeoIds.add(checkId);
                if (node) {
                    for (let depId of node.dependencies) {
                        if (!deletedGeoIds.has(depId)) {
                            gcQueue.push(depId);
                        }
                    }
                }
            }
        }

        return deletedGeoIds;
    }
}
