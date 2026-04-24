import { BaseStorage } from "./BaseStorage.js";

/**
 * History Manager wrapper for state history and undo/redo capabilities.
 * Implements the BaseStorage interface to allow seamless integration into DrawBoard.
 */
export class HistoryManager extends BaseStorage {
    constructor(baseStorage, maxHistory = 50) {
        super(baseStorage.storageKey || "cnc7_history");
        this.baseStorage = baseStorage;
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = maxHistory;
        
        // Try to load initial from base storage
        let initialData = this.baseStorage.load();
        if (initialData) {
            this.history.push(JSON.parse(JSON.stringify(initialData)));
            this.currentIndex = 0;
        } else {
            // Push an empty initial state
            const emptyState = { geometries: [], constraints: [] };
            this.history.push(emptyState);
            this.currentIndex = 0;
        }
    }

    save(data) {
        // Deep clone data to avoid reference mutation issues
        const clonedData = JSON.parse(JSON.stringify(data));
        
        // Chop off any future history if we are overwriting from the middle
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        this.history.push(clonedData);
        if (this.history.length > this.maxHistory) {
            this.history.shift(); // remove oldest
        } else {
            this.currentIndex++;
        }
        
        // Pass through to actual storage (like localStorage)
        this.baseStorage.save(clonedData);
    }

    load() {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
        }
        return this.baseStorage.load();
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.baseStorage.clear();
        
        // Push an empty state again
        const emptyState = { geometries: [], constraints: [] };
        this.history.push(emptyState);
        this.currentIndex = 0;
    }

    undo() {
        if (this.canUndo()) {
            this.currentIndex--;
            const data = this.load();
            this.baseStorage.save(data);
            return data;
        }
        return null;
    }

    redo() {
        if (this.canRedo()) {
            this.currentIndex++;
            const data = this.load();
            this.baseStorage.save(data);
            return data;
        }
        return null;
    }

    canUndo() {
        return this.currentIndex > 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }
}
