export const ActionTypes = {
    CLEAR: 'CLEAR',
    POINT: 'POINT',
    LINE: 'LINE',
    CIRCLE: 'CIRCLE',
    CIRCLE_3P: 'CIRCLE_3P',
    CIRCLE_2T1R: 'CIRCLE_2T1R',
    CIRCLE_3T: 'CIRCLE_3T',
    ARC: 'ARC',
    ARC_3P: 'ARC_3P',
    MEASURE_LENGTH: 'MEASURE_LENGTH',
    MEASURE_HORIZONTAL: 'MEASURE_HORIZONTAL',
    MEASURE_VERTICAL: 'MEASURE_VERTICAL',
    MEASURE_ANGLE: 'MEASURE_ANGLE',
    MEASURE_RADIUS: 'MEASURE_RADIUS',
    SELECT: 'SELECT',
    MOVE: 'MOVE',
    PASTE: 'PASTE',
    UNDO: 'UNDO',
    REDO: 'REDO',
    ZOOM_IN: 'ZOOM_IN',
    ZOOM_OUT: 'ZOOM_OUT',
    ESCAPE: 'ESCAPE'
};

export class CommandRegistry {
    constructor() {
        this.commands = new Map();
        this.initDefaultCommands();
    }

    registerCommand(actionType, config) {
        this.commands.set(actionType, config);
    }

    getCommand(actionType) {
        return this.commands.get(actionType);
    }

    getAllCommands() {
        return Array.from(this.commands.values());
    }

    initDefaultCommands() {
        this.registerCommand(ActionTypes.CLEAR, { id: ActionTypes.CLEAR, label: 'Clear', hotkey: 'Shift+C' });
        this.registerCommand(ActionTypes.POINT, { id: ActionTypes.POINT, label: 'Point', hotkey: 'P' });
        this.registerCommand(ActionTypes.LINE, { id: ActionTypes.LINE, label: 'Line', hotkey: 'L' });
        this.registerCommand(ActionTypes.CIRCLE, { id: ActionTypes.CIRCLE, label: 'Circle (C+R)', hotkey: 'C' });
        this.registerCommand(ActionTypes.CIRCLE_3P, { id: ActionTypes.CIRCLE_3P, label: 'Circle (3P)', hotkey: '3' });
        this.registerCommand(ActionTypes.CIRCLE_2T1R, { id: ActionTypes.CIRCLE_2T1R, label: 'Circle (2T, 1R)', hotkey: '2' });
        this.registerCommand(ActionTypes.CIRCLE_3T, { id: ActionTypes.CIRCLE_3T, label: 'Circle (3T)', hotkey: 'T' });
        this.registerCommand(ActionTypes.ARC, { id: ActionTypes.ARC, label: 'Arc (C+S+E)', hotkey: 'A' });
        this.registerCommand(ActionTypes.ARC_3P, { id: ActionTypes.ARC_3P, label: 'Arc (3P)', hotkey: 'Shift+A' });
        
        this.registerCommand(ActionTypes.MEASURE_LENGTH, { id: ActionTypes.MEASURE_LENGTH, label: 'Measure Length', hotkey: 'M' });
        this.registerCommand(ActionTypes.MEASURE_HORIZONTAL, { id: ActionTypes.MEASURE_HORIZONTAL, label: 'Measure Horizontal', hotkey: 'H' });
        this.registerCommand(ActionTypes.MEASURE_VERTICAL, { id: ActionTypes.MEASURE_VERTICAL, label: 'Measure Vertical', hotkey: 'V' });
        this.registerCommand(ActionTypes.MEASURE_ANGLE, { id: ActionTypes.MEASURE_ANGLE, label: 'Measure Angle', hotkey: 'G' });
        this.registerCommand(ActionTypes.MEASURE_RADIUS, { id: ActionTypes.MEASURE_RADIUS, label: 'Measure Radius', hotkey: 'R' });

        this.registerCommand(ActionTypes.ESCAPE, { id: ActionTypes.ESCAPE, label: 'ESC', hotkey: 'Escape' });
        this.registerCommand(ActionTypes.SELECT, { id: ActionTypes.SELECT, label: 'Select', hotkey: 'S' });
        this.registerCommand(ActionTypes.MOVE, { id: ActionTypes.MOVE, label: 'Move', hotkey: 'W' }); // Move mapped to W
        this.registerCommand(ActionTypes.PASTE, { id: ActionTypes.PASTE, label: 'Paste', hotkey: 'Ctrl+V' });
        
        this.registerCommand(ActionTypes.UNDO, { id: ActionTypes.UNDO, label: 'Undo', hotkey: 'Ctrl+Z' });
        this.registerCommand(ActionTypes.REDO, { id: ActionTypes.REDO, label: 'Redo', hotkey: 'Ctrl+Y' });
        this.registerCommand(ActionTypes.ZOOM_IN, { id: ActionTypes.ZOOM_IN, label: '+', hotkey: '+' });
        this.registerCommand(ActionTypes.ZOOM_OUT, { id: ActionTypes.ZOOM_OUT, label: '-', hotkey: '-' });
    }
}

export const globalCommandRegistry = new CommandRegistry();