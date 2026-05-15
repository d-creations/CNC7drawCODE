import { BaseTool } from './BaseTool.js';
import { isObjectType } from '../core/ObjectType.js';

const CAM_ALLOWED_TYPES = ['Point', 'DrawLine', 'DrawArc', 'DrawCircle'];

export class CAMSelectionTool extends BaseTool {
    constructor(drawBoard) {
        super(drawBoard);
        this.startPointId = null;
        this.sequenceIds = [];
        this.selectedObjects = [];
        this.lastGCode = '';
        this.lastError = '';
    }

    onCanvasClick(x, y) {
        const allowedTypes = this.startPointId ? CAM_ALLOWED_TYPES : ['Point'];
        const snapped = this.drawBoard.selectStartObject(x, y, allowedTypes);

        if (!snapped.exist || !snapped.obj || !snapped.obj.constraintId) {
            this.lastError = this.startPointId
                ? 'Select a point, line, arc, or circle that continues the current CAM path.'
                : 'Select a start point for the CAM path.';
            this.drawBoard.draw();
            return false;
        }

        return this.onObjectSelected(snapped.obj);
    }

    onObjectSelected(obj) {
        if (!obj || !obj.constraintId) {
            this.lastError = 'Select a valid CAM entity.';
            this.drawBoard.draw();
            return false;
        }

        if (!this.startPointId) {
            if (!isObjectType(obj, 'Point')) {
                this.lastError = 'The CAM path must begin on a point.';
                this.drawBoard.draw();
                return false;
            }
            this.startPointId = obj.constraintId;
            this.selectedObjects = [obj];
            this.lastError = '';
            this.refreshPreview();
            return true;
        }

        const candidateId = obj.constraintId;
        const nextSequence = [...this.sequenceIds, candidateId];

        try {
            this.lastGCode = this.drawBoard.exportGCode({
                startPointId: this.startPointId,
                sequence: nextSequence,
                includeFooter: false
            });
            this.sequenceIds = nextSequence;
            this.selectedObjects.push(obj);
            this.lastError = '';
            this.refreshPreview();
            return true;
        } catch (error) {
            this.lastError = error.message;
            this.drawBoard.draw();
            return false;
        }
    }

    exportSelection(options = {}) {
        if (!this.startPointId) {
            this.lastError = 'Select a CAM start point first.';
            return '';
        }

        try {
            this.lastGCode = this.drawBoard.exportGCode({
                startPointId: this.startPointId,
                sequence: this.sequenceIds,
                ...options
            });
            this.lastError = '';
            this.refreshPreview();
            return this.lastGCode;
        } catch (error) {
            this.lastError = error.message;
            return '';
        }
    }

    undoLastSelection() {
        if (!this.startPointId) return;

        if (this.sequenceIds.length === 0) {
            this.clearSelection();
            return;
        }

        this.sequenceIds.pop();
        this.selectedObjects.pop();
        this.lastError = '';

        if (this.sequenceIds.length === 0) {
            this.lastGCode = '';
            this.refreshPreview();
            return;
        }

        this.exportSelection({ includeFooter: false });
        this.refreshPreview();
    }

    clearSelection() {
        this.startPointId = null;
        this.sequenceIds = [];
        this.selectedObjects = [];
        this.lastGCode = '';
        this.lastError = '';
        this.drawBoard.selectedObjects = [];
        this.drawBoard.draw();
    }

    refreshPreview() {
        this.drawBoard.selectedObjects = [...this.selectedObjects];
        this.drawBoard.draw();
    }
}