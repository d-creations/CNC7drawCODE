import { ActionTypes, globalCommandRegistry } from '../core/CommandRegistry.js';
import { MouseState } from './MouseControl.js';

export class KeyboardManager {
    constructor(mouseControl, drawBoard) {
        this.mouseControl = mouseControl;
        this.drawBoard = drawBoard;
        this.setupListeners();
    }

    setupListeners() {
        document.addEventListener('keydown', (e) => {
            // Ignore events from input fields to prevent conflicting with typing
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
                return;
            }

            const isCtrl = e.ctrlKey || e.metaKey;
            const isShift = e.shiftKey;
            let keyStr = e.key;
            
            if (keyStr.length === 1) {
                keyStr = keyStr.toUpperCase(); 
            }

            let hotkey = '';
            if (isCtrl) hotkey += 'Ctrl+';
            if (isShift) hotkey += 'Shift+';
            hotkey += keyStr;

            this.handleHotkey(hotkey, e);
        });
    }

    handleHotkey(hotkey, event) {
        // Fallback for Escape directly hitting MouseState
        if (hotkey === 'Escape') {
            this.mouseControl.setState(MouseState.SELECT);
            return;
        }
        
        let actions = globalCommandRegistry.getAllCommands();
        for (let cmd of actions) {
            if (cmd.hotkey === hotkey) {
                event.preventDefault(); // Prevent default browser behavior (e.g. Ctrl+S)
                this.executeAction(cmd.id);
                return;
            }
        }
    }

    executeAction(actionId) {
        switch (actionId) {
            case ActionTypes.CLEAR:
                this.mouseControl.setState(MouseState.NONE);
                this.drawBoard.clearAll();
                break;
            case ActionTypes.POINT:
                this.mouseControl.setState(MouseState.POINT);
                break;
            case ActionTypes.LINE:
                this.mouseControl.setState(MouseState.LINE);
                break;
            case ActionTypes.CIRCLE:
                this.mouseControl.setState(MouseState.CIRCLE);
                break;
            case ActionTypes.CIRCLE_3P:
                this.mouseControl.setState(MouseState.CIRCLE_3P);
                break;
            case ActionTypes.CIRCLE_2T1R:
                this.mouseControl.setState(MouseState.CIRCLE_2T1R);
                break;
            case ActionTypes.CIRCLE_3T:
                this.mouseControl.setState(MouseState.CIRCLE_3T);
                break;
            case ActionTypes.ARC:
                this.mouseControl.setState(MouseState.ARC);
                break;
            case ActionTypes.ARC_3P:
                this.mouseControl.setState(MouseState.ARC_3P);
                break;
            case ActionTypes.MEASURE_LENGTH:
                this.mouseControl.setState(MouseState.MEASURE_LENGTH);
                break;
            case ActionTypes.MEASURE_HORIZONTAL:
                this.mouseControl.setState(MouseState.MEASURE_HORIZONTAL);
                break;
            case ActionTypes.MEASURE_VERTICAL:
                this.mouseControl.setState(MouseState.MEASURE_VERTICAL);
                break;
            case ActionTypes.MEASURE_ANGLE:
                this.mouseControl.setState(MouseState.MEASURE_ANGLE);
                break;
            case ActionTypes.MEASURE_RADIUS:
                this.mouseControl.setState(MouseState.MEASURE_RADIUS);
                break;
            case ActionTypes.SELECT:
                this.mouseControl.setState(MouseState.SELECT);
                break;
            case ActionTypes.MOVE:
                this.mouseControl.setState(MouseState.MOVE);
                break;
            case ActionTypes.PASTE:
                this.mouseControl.setState(MouseState.PASTE);
                break;
            case ActionTypes.UNDO:
                this.drawBoard.undo();
                break;
            case ActionTypes.REDO:
                this.drawBoard.redo();
                break;
            case ActionTypes.ZOOM_IN:
                this.drawBoard.zoom(1.2);
                break;
            case ActionTypes.ZOOM_OUT:
                this.drawBoard.zoom(1/1.2);
                break;
            case ActionTypes.ESCAPE:
                this.mouseControl.setState(MouseState.SELECT);
                break;
            default:
                break;
        }
    }
}