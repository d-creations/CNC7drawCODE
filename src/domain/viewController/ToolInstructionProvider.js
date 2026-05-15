import { MouseState } from './MouseControl.js';

export const ToolInstructionActionIds = {
    CAM_EXPORT: 'cam.export',
    CAM_UNDO_LAST: 'cam.undoLast',
    CAM_CLEAR: 'cam.clear',
    CAM_COPY: 'cam.copy',
    CIRCLE_2T1R_CONFIRM: 'circle2t1r.confirm'
};

export const ToolInstructionFieldIds = {
    COMMAND_RADIUS: 'commandRadius',
    COMMAND_CHAMFER_SIZE: 'commandChamferSize'
};

const HIDDEN_STATES = new Set([MouseState.NONE, MouseState.SELECT, MouseState.MOVE]);

function createSnapshot(state) {
    return {
        visible: !HIDDEN_STATES.has(state),
        state,
        title: '',
        instruction: '',
        status: null,
        fields: [],
        actions: [],
        output: null
    };
}

export class ToolInstructionProvider {
    constructor(mouseControl) {
        this.mouseControl = mouseControl;
    }

    getSnapshot() {
        const state = this.mouseControl.buttonState;
        const snapshot = createSnapshot(state);

        if (!snapshot.visible) {
            return snapshot;
        }

        if (state === MouseState.POINT) {
            snapshot.title = 'Tool: Point';
            snapshot.instruction = 'Click anywhere to place a point.';
        } else if (state === MouseState.LINE) {
            snapshot.title = 'Tool: Line';
            snapshot.instruction = 'Click and drag to draw a line.';
        } else if (state === MouseState.CIRCLE) {
            snapshot.title = 'Tool: Circle (Center + Radius)';
            snapshot.instruction = 'Click and drag to define center and radius.';
        } else if (state === MouseState.ARC) {
            snapshot.title = 'Tool: Arc (Center + Start + End)';
            const step = this.mouseControl.arcCenterTool.step;
            if (step === 'placeCenter') snapshot.instruction = 'Step 1/3: Click to place Arc Center.';
            else if (step === 'placeStart') snapshot.instruction = 'Step 2/3: Click to place Start Point / Radius.';
            else if (step === 'placeEnd') snapshot.instruction = 'Step 3/3: Click to define End Angle.';
        } else if (state === MouseState.ARC_3P) {
            snapshot.title = 'Tool: 3-Point Arc';
            const step = this.mouseControl.arc3PTool.step;
            if (step === 'placeStart') snapshot.instruction = 'Step 1/3: Click to place Start Point.';
            else if (step === 'placeEnd') snapshot.instruction = 'Step 2/3: Click to place End Point.';
            else if (step === 'placeRadius') snapshot.instruction = 'Step 3/3: Move mouse to define Arc Curvature and click.';
        } else if (state === MouseState.CHAMFER_45) {
            snapshot.title = 'Tool: Chamfer 45';
            const lines = this.mouseControl.cornerChamfer45Tool.selectedVisualLines.length;
            snapshot.instruction = lines === 0
                ? 'Step 1/2: Select the first perpendicular line at the corner.'
                : 'Step 2/2: Select the second perpendicular line. The new chamfer edge will be fixed to the size below.';
            snapshot.fields.push({
                id: ToolInstructionFieldIds.COMMAND_CHAMFER_SIZE,
                label: 'Edge Size',
                type: 'number',
                min: '0.01',
                step: '0.1',
                value: this.mouseControl.commandChamferSize
            });
        } else if (state === MouseState.TRIM) {
            snapshot.title = 'Tool: Trim Line';
            snapshot.instruction = this.mouseControl.trimTool.step === 0
                ? 'Step 1/2: Select the boundary shape (line, circle, arc) to trim with.'
                : 'Step 2/2: Click on the segment of a line you want to remove. It will be trimmed back to the boundary.';
        } else if (state === MouseState.EXTEND) {
            snapshot.title = 'Tool: Extend Line';
            snapshot.instruction = this.mouseControl.extendTool.step === 0
                ? 'Step 1/2: Select the boundary shape (line, circle, arc) to extend to.'
                : 'Step 2/2: Click near the end of a line you want to extend. It will extend to the boundary.';
        } else if (state === MouseState.FILLET_ARC) {
            snapshot.title = 'Tool: Fillet Radius';
            const lines = this.mouseControl.filletArcTool.selectedVisualLines.length;
            if (lines === 0) snapshot.instruction = 'Step 1/3: Select the first line of the corner.';
            else if (lines === 1) snapshot.instruction = 'Step 2/3: Select the second line of the corner.';
            else snapshot.instruction = 'Step 3/3: Click inside the desired corner quadrant to place the fillet arc.';
            snapshot.fields.push({
                id: ToolInstructionFieldIds.COMMAND_RADIUS,
                label: 'Radius',
                type: 'number',
                min: '0.01',
                step: '0.1',
                value: this.mouseControl.commandRadius
            });
        } else if (state === MouseState.CIRCLE_3P) {
            snapshot.title = 'Tool: 3-Point Circle';
            const points = this.mouseControl.circle3PTool.selectedPoints.length;
            if (points === 0) snapshot.instruction = 'Step 1/3: Select 1st point';
            else if (points === 1) snapshot.instruction = 'Step 2/3: Select 2nd point';
            else if (points === 2) snapshot.instruction = 'Step 3/3: Select 3rd point (final)';
        } else if (state === MouseState.CAM_PATH) {
            const camTool = this.mouseControl.camSelectionTool;
            snapshot.title = 'Tool: CAM Path';
            snapshot.instruction = !camTool.startPointId
                ? 'Step 1: Click a start point.'
                : 'Step 2: Click an ordered chain of points, lines, arcs, or circles to build the toolpath.';
            snapshot.status = {
                tone: camTool.lastError ? 'error' : 'success',
                text: camTool.lastError
                    ? camTool.lastError
                    : `Start: ${camTool.startPointId || '-'} | Segments: ${camTool.sequenceIds.length}`
            };
            snapshot.actions.push(
                { id: ToolInstructionActionIds.CAM_EXPORT, label: 'Export' },
                { id: ToolInstructionActionIds.CAM_UNDO_LAST, label: 'Undo Last' },
                { id: ToolInstructionActionIds.CAM_CLEAR, label: 'Clear' },
                { id: ToolInstructionActionIds.CAM_COPY, label: 'Copy' }
            );
            snapshot.output = {
                readOnly: true,
                value: camTool.lastGCode || '',
                placeholder: 'G-code output will appear here after you select a valid CAM path.'
            };
        } else if (state === MouseState.MEASURE_LENGTH) {
            snapshot.title = 'Tool: Measure Length';
            snapshot.instruction = this.mouseControl.lengthMeasurementTool.step === 0
                ? 'Step 1/2: Select start point'
                : 'Step 2/2: Select end point';
        } else if (state === MouseState.MEASURE_HORIZONTAL) {
            snapshot.title = 'Tool: Measure Horizontal';
            snapshot.instruction = this.mouseControl.horizontalMeasurementTool.step === 0
                ? 'Step 1/2: Select start point'
                : 'Step 2/2: Select end point';
        } else if (state === MouseState.MEASURE_VERTICAL) {
            snapshot.title = 'Tool: Measure Vertical';
            snapshot.instruction = this.mouseControl.verticalMeasurementTool.step === 0
                ? 'Step 1/2: Select start point'
                : 'Step 2/2: Select end point';
        } else if (state === MouseState.MEASURE_ANGLE) {
            snapshot.title = 'Tool: Measure Angle';
            snapshot.instruction = this.mouseControl.angleMeasurementTool.step === 0
                ? 'Step 1/2: Select first line'
                : 'Step 2/2: Select second line';
        } else if (state === MouseState.MEASURE_LINECIRCLE) {
            snapshot.title = 'Tool: Line-Circle Distance';
            const step = this.mouseControl.lineCircleMeasurementTool.step;
            if (step === 0) snapshot.instruction = 'Step 1/3: Select a Line or Circle structure';
            else if (step === 1) snapshot.instruction = 'Step 2/3: Select the other structure type (Line or Circle)';
            else if (step === 2) snapshot.instruction = 'Step 3/3: Move mouse to position offset and click to place';
        } else if (state === MouseState.CONSTRAINT_HORIZONTAL) {
            snapshot.title = 'Constraint: Horizontal Alignment';
            snapshot.instruction = this.mouseControl.geometricHorizontalTool.step === 0
                ? 'Step 1/2: Select first point'
                : 'Step 2/2: Select second point';
        } else if (state === MouseState.CONSTRAINT_VERTICAL) {
            snapshot.title = 'Constraint: Vertical Alignment';
            snapshot.instruction = this.mouseControl.geometricVerticalTool.step === 0
                ? 'Step 1/2: Select first point'
                : 'Step 2/2: Select second point';
        } else if (state === MouseState.CONSTRAINT_TANGENT) {
            snapshot.title = 'Constraint: Tangent';
            snapshot.instruction = this.mouseControl.geometricTangentTool.step === 0
                ? 'Step 1/2: Select a Line or Circle structure'
                : 'Step 2/2: Select a touching Line or Circle structure';
        } else if (state === MouseState.MEASURE_RADIUS) {
            snapshot.title = 'Tool: Measure Radius';
            snapshot.instruction = 'Click on a circle to measure its radius';
        } else if (state === MouseState.PASTE) {
            snapshot.title = 'Tool: Paste';
            snapshot.instruction = 'Move mouse to position clipboard objects, click to paste.';
        } else if (state === MouseState.CIRCLE_3T) {
            snapshot.title = 'Tool: 3-Tangent Circle';
            const lines = this.mouseControl.circle3TTool.selectedLines.length;
            if (lines === 0) snapshot.instruction = 'Step 1/3: Select 1st intersecting object';
            else if (lines === 1) snapshot.instruction = 'Step 2/3: Select 2nd intersecting object';
            else if (lines === 2) snapshot.instruction = 'Step 3/3: Select 3rd intersecting object (final)';
        } else if (state === MouseState.CIRCLE_2T1R) {
            snapshot.title = 'Tool: Circle (2 Tangents, 1 Radius)';
            const lines = this.mouseControl.circle2T1RTool.selectedLines.length;
            if (lines === 0) {
                snapshot.instruction = 'Step 1/3: Select 1st tangent object';
            } else if (lines === 1) {
                snapshot.instruction = 'Step 2/3: Select 2nd tangent object';
            } else if (lines === 2) {
                snapshot.instruction = 'Step 3/3: Click inside a quadrant to place circle.';
                snapshot.fields.push({
                    id: ToolInstructionFieldIds.COMMAND_RADIUS,
                    label: 'Radius',
                    type: 'number',
                    value: this.mouseControl.commandRadius,
                    actionId: ToolInstructionActionIds.CIRCLE_2T1R_CONFIRM,
                    actionLabel: 'OK'
                });
            }
        }

        return snapshot;
    }

    setFieldValue(fieldId, rawValue) {
        const value = parseFloat(rawValue);
        if (Number.isNaN(value) || value <= 0) {
            return false;
        }

        if (fieldId === ToolInstructionFieldIds.COMMAND_RADIUS) {
            this.mouseControl.commandRadius = value;
            return true;
        }

        if (fieldId === ToolInstructionFieldIds.COMMAND_CHAMFER_SIZE) {
            this.mouseControl.commandChamferSize = value;
            return true;
        }

        return false;
    }

    runAction(actionId) {
        const camTool = this.mouseControl.camSelectionTool;

        if (actionId === ToolInstructionActionIds.CAM_EXPORT) {
            camTool.exportSelection();
            return true;
        }

        if (actionId === ToolInstructionActionIds.CAM_UNDO_LAST) {
            camTool.undoLastSelection();
            return true;
        }

        if (actionId === ToolInstructionActionIds.CAM_CLEAR) {
            camTool.clearSelection();
            return true;
        }

        if (actionId === ToolInstructionActionIds.CAM_COPY) {
            if (!camTool.lastGCode) {
                camTool.exportSelection();
            }
            if (camTool.lastGCode && navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(camTool.lastGCode);
            }
            return true;
        }

        if (actionId === ToolInstructionActionIds.CIRCLE_2T1R_CONFIRM) {
            this.mouseControl.forceComplete2T1R();
            return true;
        }

        return false;
    }
}