/**
 * Abstract Base Class defining the standard interface for any Storage Module.
 * Decouples the concrete storage mechanism (Local, Session, DB, Cloud API) 
 * from the consuming application logic.
 */
export class BaseStorage {
    constructor(storageKey) {
        if (this.constructor === BaseStorage) {
            throw new Error("BaseStorage is an abstract class and cannot be instantiated directly.");
        }
        this.storageKey = storageKey;
    }

    /**
     * Serializes and saves an object to the underlying storage medium.
     * @param {any} data - The JSON-serializable object payload to save.
     * @abstract
     */
    save(data) {
        throw new Error("Method 'save(data)' must be implemented by subclasses.");
    }

    /**
     * Retrieves and parses data from the storage medium.
     * @returns {any|null} The parsed object, or null if empty/invalid.
     * @abstract
     */
    load() {
        throw new Error("Method 'load()' must be implemented by subclasses.");
    }

    /**
     * Completely deletes the stored data associated with this key.
     * @abstract
     */
    clear() {
        throw new Error("Method 'clear()' must be implemented by subclasses.");
    }
}
