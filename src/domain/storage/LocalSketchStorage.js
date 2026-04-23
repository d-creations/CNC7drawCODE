import { BaseStorage } from "./BaseStorage.js";

/**
 * @typedef {import("../constraints/ConstraintSystem.js").SketchData} SketchData
 */

/**
 * Concrete class implementing Browser LocalStorage.
 * Extends the abstract BaseStorage.
 */
export class LocalSketchStorage extends BaseStorage {
    constructor(storageKey = "cnc7_active_sketch") {
        super(storageKey);
    }

    /**
     * Serializes and saves the active CAD Sketch architecture Data to local storage.
     * @param {SketchData} data 
     */
    save(data) {
        try {
            const raw = JSON.stringify(data);
            localStorage.setItem(this.storageKey, raw);
            console.log(`[Storage] Saved ${data.geometries.length} geometries and ${data.constraints.length} constraints.`);
        } catch (e) {
            console.error("[Storage] Failed to save sketch data:", e);
        }
    }

    /**
     * Retrieves and unpacks JSON data from browser storage if it exists.
     * @returns {SketchData|null}
     */
    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const data = JSON.parse(raw);
                console.log("[Storage] Successfully loaded previous sketch session.");
                return data;
            }
        } catch (e) {
            console.error("[Storage] Failed to parse corrupted local storage data:", e);
        }
        return null;
    }

    /**
     * Wipes the storage for this project key.
     */
    clear() {
        localStorage.removeItem(this.storageKey);
        console.log("[Storage] Cleared local data.");
    }
}
