import { MouseState } from './MouseControl.js';
import { ActionTypes, globalCommandRegistry } from '../core/CommandRegistry.js';
import { ToolInstructionProvider } from './ToolInstructionProvider.js';

export class CommandPanel {
    constructor(parentDiv, mouseControl) {
        this.mouseControl = mouseControl;
        this.instructionProvider = new ToolInstructionProvider(mouseControl);
        
        this.container = document.createElement('div');
        this.container.className = "command-panel";
        this.container.style.position = "absolute";
        this.container.style.top = "10px";
        this.container.style.left = "50%";
        this.container.style.transform = "translateX(-50%)";
        this.container.style.backgroundColor = "rgba(40, 40, 40, 0.95)";
        this.container.style.color = "white";
        this.container.style.padding = "10px 20px";
        this.container.style.borderRadius = "8px";
        this.container.style.boxShadow = "0px 4px 12px rgba(0,0,0,0.3)";
        this.container.style.fontFamily = "sans-serif";
        this.container.style.display = "none";
        this.container.style.zIndex = "1000";
        this.container.style.pointerEvents = "auto";
        
        parentDiv.appendChild(this.container);
        this.mouseControl.onStateChange = () => this.render();
        
        this.createToolbar(parentDiv);
    }

    createToolbar(parentDiv) {
        let menudiv = document.createElement("div");
        menudiv.className = "toolbar-menu";
        
        const getLabel = (actionType) => {
            const cmd = globalCommandRegistry.getCommand(actionType);
            return `${cmd.label} [${cmd.hotkey}]`;
        };

        let buttonClear = document.createElement("Button");
        buttonClear.innerText = getLabel(ActionTypes.CLEAR);
        buttonClear.addEventListener('click', () => {
            this.mouseControl.setState(MouseState.NONE);
            this.mouseControl.drawBoard.clearAll();
        });

        let buttonPoint = document.createElement("Button");
        buttonPoint.innerText = getLabel(ActionTypes.POINT);
        buttonPoint.addEventListener('click', () => { this.mouseControl.setState(MouseState.POINT); });

        let buttonLine = document.createElement("Button");
        buttonLine.innerText = getLabel(ActionTypes.LINE);
        buttonLine.addEventListener('click', () => { this.mouseControl.setState(MouseState.LINE); });
        
        let buttonCircle = document.createElement("Button");
        buttonCircle.innerText = getLabel(ActionTypes.CIRCLE);
        buttonCircle.addEventListener('click', () => { this.mouseControl.setState(MouseState.CIRCLE); });

        let buttonCircle3P = document.createElement("Button");
        buttonCircle3P.innerText = getLabel(ActionTypes.CIRCLE_3P);
        buttonCircle3P.addEventListener('click', () => { this.mouseControl.setState(MouseState.CIRCLE_3P); });

        let buttonCircle2TR = document.createElement("Button");
        buttonCircle2TR.innerText = getLabel(ActionTypes.CIRCLE_2T1R);
        buttonCircle2TR.addEventListener('click', () => { this.mouseControl.setState(MouseState.CIRCLE_2T1R); });

        let buttonCircle3T = document.createElement("Button");
        buttonCircle3T.innerText = getLabel(ActionTypes.CIRCLE_3T);
        buttonCircle3T.addEventListener('click', () => { this.mouseControl.setState(MouseState.CIRCLE_3T); });

        let buttonArc = document.createElement("Button");
        buttonArc.innerText = getLabel(ActionTypes.ARC);
        buttonArc.addEventListener('click', () => { this.mouseControl.setState(MouseState.ARC); });

        let buttonArc3P = document.createElement("Button");
        buttonArc3P.innerText = getLabel(ActionTypes.ARC_3P);
        buttonArc3P.addEventListener('click', () => { this.mouseControl.setState(MouseState.ARC_3P); });

        let buttonChamfer45 = document.createElement("Button");
        buttonChamfer45.innerText = getLabel(ActionTypes.CHAMFER_45);
        buttonChamfer45.addEventListener('click', () => { this.mouseControl.setState(MouseState.CHAMFER_45); });

        let buttonFilletArc = document.createElement("Button");
        buttonFilletArc.innerText = getLabel(ActionTypes.FILLET_ARC);
        buttonFilletArc.addEventListener('click', () => { this.mouseControl.setState(MouseState.FILLET_ARC); });

        let buttonTrim = document.createElement("Button");
        buttonTrim.innerText = getLabel(ActionTypes.TRIM);
        buttonTrim.addEventListener('click', () => { this.mouseControl.setState(MouseState.TRIM); });

        let buttonExtend = document.createElement("Button");
        buttonExtend.innerText = getLabel(ActionTypes.EXTEND);
        buttonExtend.addEventListener('click', () => { this.mouseControl.setState(MouseState.EXTEND); });

        let buttonCamPath = document.createElement("Button");
        buttonCamPath.innerText = getLabel(ActionTypes.CAM_PATH);
        buttonCamPath.addEventListener('click', () => { this.mouseControl.setState(MouseState.CAM_PATH); });

        let buttonMeasureLength = document.createElement("Button");
        buttonMeasureLength.innerText = getLabel(ActionTypes.MEASURE_LENGTH);
        buttonMeasureLength.addEventListener('click', () => { this.mouseControl.setState(MouseState.MEASURE_LENGTH); });

        let buttonMeasureHorizontal = document.createElement("Button");
        buttonMeasureHorizontal.innerText = getLabel(ActionTypes.MEASURE_HORIZONTAL);
        buttonMeasureHorizontal.addEventListener('click', () => { this.mouseControl.setState(MouseState.MEASURE_HORIZONTAL); });

        let buttonMeasureVertical = document.createElement("Button");
        buttonMeasureVertical.innerText = getLabel(ActionTypes.MEASURE_VERTICAL);
        buttonMeasureVertical.addEventListener('click', () => { this.mouseControl.setState(MouseState.MEASURE_VERTICAL); });

        let buttonMeasureAngle = document.createElement("Button");
        buttonMeasureAngle.innerText = getLabel(ActionTypes.MEASURE_ANGLE);
        buttonMeasureAngle.addEventListener('click', () => { this.mouseControl.setState(MouseState.MEASURE_ANGLE); });

        let buttonMeasureRadius = document.createElement("Button");
        buttonMeasureRadius.innerText = getLabel(ActionTypes.MEASURE_RADIUS);
        buttonMeasureRadius.addEventListener('click', () => { this.mouseControl.setState(MouseState.MEASURE_RADIUS); });

        let buttonMeasureLineCircle = document.createElement("Button");
        buttonMeasureLineCircle.innerText = getLabel(ActionTypes.MEASURE_LINECIRCLE);
        buttonMeasureLineCircle.addEventListener('click', () => { this.mouseControl.setState(MouseState.MEASURE_LINECIRCLE); });

        let buttonConstraintHorizontal = document.createElement("Button");
        buttonConstraintHorizontal.innerText = getLabel(ActionTypes.CONSTRAINT_HORIZONTAL);
        buttonConstraintHorizontal.addEventListener('click', () => { this.mouseControl.setState(MouseState.CONSTRAINT_HORIZONTAL); });

        let buttonConstraintVertical = document.createElement("Button");
        buttonConstraintVertical.innerText = getLabel(ActionTypes.CONSTRAINT_VERTICAL);
        buttonConstraintVertical.addEventListener('click', () => { this.mouseControl.setState(MouseState.CONSTRAINT_VERTICAL); });

        let buttonConstraintTangent = document.createElement("Button");
        buttonConstraintTangent.innerText = getLabel(ActionTypes.CONSTRAINT_TANGENT);
        buttonConstraintTangent.addEventListener('click', () => { this.mouseControl.setState(MouseState.CONSTRAINT_TANGENT); });

        let circleGroup = document.createElement("div");
        circleGroup.style.border = "1px solid #ccc";
        circleGroup.style.padding = "5px";
        circleGroup.style.margin = "5px";
        circleGroup.style.display = "inline-flex";
        circleGroup.style.flexDirection = "column";
        circleGroup.innerText = "Circles";
        circleGroup.style.fontSize = "12px";

        circleGroup.appendChild(buttonCircle);
        circleGroup.appendChild(buttonCircle3P);
        circleGroup.appendChild(buttonCircle2TR);
        circleGroup.appendChild(buttonCircle3T);
        circleGroup.appendChild(buttonArc);
        circleGroup.appendChild(buttonArc3P);
        circleGroup.appendChild(buttonChamfer45);
        circleGroup.appendChild(buttonFilletArc);
        circleGroup.appendChild(buttonTrim);
        circleGroup.appendChild(buttonExtend);
        circleGroup.appendChild(buttonCamPath);

        let measureGroup = document.createElement("div");
        measureGroup.style.border = "1px solid #ccc";
        measureGroup.style.padding = "5px";
        measureGroup.style.margin = "5px";
        measureGroup.style.display = "inline-flex";
        measureGroup.style.flexDirection = "column";
        measureGroup.innerText = "Measure";
        measureGroup.style.fontSize = "12px";

        measureGroup.appendChild(buttonMeasureLength);
        measureGroup.appendChild(buttonMeasureLineCircle);
        measureGroup.appendChild(buttonMeasureHorizontal);
        measureGroup.appendChild(buttonMeasureVertical);
        measureGroup.appendChild(buttonMeasureAngle);
        measureGroup.appendChild(buttonMeasureRadius);

        let constraintGroup = document.createElement("div");
        constraintGroup.style.border = "1px solid #ccc";
        constraintGroup.style.padding = "5px";
        constraintGroup.style.margin = "5px";
        constraintGroup.style.display = "inline-flex";
        constraintGroup.style.flexDirection = "column";
        constraintGroup.innerText = "Constraints";
        constraintGroup.style.fontSize = "12px";

        constraintGroup.appendChild(buttonConstraintHorizontal);
        constraintGroup.appendChild(buttonConstraintVertical);
        constraintGroup.appendChild(buttonConstraintTangent);

        let buttonESC = document.createElement("Button");
        buttonESC.innerText = getLabel(ActionTypes.ESCAPE);
        buttonESC.addEventListener('click', () => { this.mouseControl.setState(MouseState.SELECT); });

        let buttonSelect = document.createElement("Button");
        buttonSelect.innerText = getLabel(ActionTypes.SELECT);
        buttonSelect.addEventListener('click', () => { this.mouseControl.setState(MouseState.SELECT); });

        let buttonMove = document.createElement("Button");
        buttonMove.innerText = getLabel(ActionTypes.MOVE);
        buttonMove.addEventListener('click', () => { this.mouseControl.setState(MouseState.MOVE); });

        let buttonPaste = document.createElement("Button");
        buttonPaste.innerText = getLabel(ActionTypes.PASTE);
        buttonPaste.style.backgroundColor = "#ff9800";
        buttonPaste.style.color = "white";
        buttonPaste.style.border = "none";
        buttonPaste.style.padding = "3px 8px";
        buttonPaste.style.cursor = "pointer";
        buttonPaste.addEventListener('click', () => { 
            this.mouseControl.setState(MouseState.PASTE);
        });

        let buttonReload = document.createElement("Button");
        buttonReload.innerText = getLabel(ActionTypes.RELOAD);
        buttonReload.addEventListener('click', () => {
            this.mouseControl.setState(MouseState.SELECT);
            this.mouseControl.drawBoard.reloadState();
        });

        let buttonUndo = document.createElement("Button");
        buttonUndo.innerText = getLabel(ActionTypes.UNDO);
        buttonUndo.addEventListener('click', () => { this.mouseControl.drawBoard.undo(); });

        let buttonRedo = document.createElement("Button");
        buttonRedo.innerText = getLabel(ActionTypes.REDO);
        buttonRedo.addEventListener('click', () => { this.mouseControl.drawBoard.redo(); });

        let buttonZoomIn = document.createElement("Button");
        buttonZoomIn.innerText = getLabel(ActionTypes.ZOOM_IN);
        buttonZoomIn.addEventListener('click', () => { this.mouseControl.drawBoard.zoom(1.2); });

        let buttonZoomOut = document.createElement("Button");
        buttonZoomOut.innerText = getLabel(ActionTypes.ZOOM_OUT);
        buttonZoomOut.addEventListener('click', () => { this.mouseControl.drawBoard.zoom(1/1.2); });

        menudiv.appendChild(buttonMove);
        menudiv.appendChild(buttonPaste);
        menudiv.appendChild(buttonReload);
        menudiv.appendChild(buttonUndo);
        menudiv.appendChild(buttonRedo);
        menudiv.appendChild(buttonZoomIn);
        menudiv.appendChild(buttonZoomOut);

        menudiv.appendChild(buttonClear);
        menudiv.appendChild(buttonPoint);
        menudiv.appendChild(buttonLine);
        menudiv.appendChild(circleGroup);
        menudiv.appendChild(measureGroup);
        menudiv.appendChild(constraintGroup);
        menudiv.appendChild(buttonESC);
        menudiv.appendChild(buttonSelect);

        let dview = document.getElementById("DView_Menu");
        if (dview) {
            dview.appendChild(menudiv);
        } else {
            parentDiv.appendChild(menudiv);
        }
    }

    createInstructionTitle(text) {
        const title = document.createElement('div');
        title.style.fontWeight = 'bold';
        title.style.fontSize = '14px';
        title.style.textTransform = 'uppercase';
        title.style.letterSpacing = '1px';
        title.innerText = text;
        return title;
    }

    createInstructionText(text) {
        const instruction = document.createElement('div');
        instruction.style.fontSize = '13px';
        instruction.style.color = '#ccc';
        instruction.innerText = text;
        return instruction;
    }

    createField(field) {
        const fieldArea = document.createElement('div');
        fieldArea.style.display = 'flex';
        fieldArea.style.alignItems = 'center';
        fieldArea.style.gap = '8px';
        fieldArea.style.marginTop = '5px';

        const label = document.createElement('label');
        label.innerText = `${field.label}:`;
        fieldArea.appendChild(label);

        const input = document.createElement('input');
        input.type = field.type || 'text';
        if (field.min !== undefined) input.min = field.min;
        if (field.step !== undefined) input.step = field.step;
        input.value = field.value;
        input.style.width = '90px';
        input.addEventListener('change', () => {
            this.instructionProvider.setFieldValue(field.id, input.value);
            this.render();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.instructionProvider.setFieldValue(field.id, input.value);
                if (field.actionId) {
                    this.instructionProvider.runAction(field.actionId);
                }
                this.render();
            }
        });
        fieldArea.appendChild(input);

        if (field.actionId) {
            const button = document.createElement('button');
            button.innerText = field.actionLabel || 'Apply';
            button.style.padding = '2px 8px';
            button.style.cursor = 'pointer';
            button.style.backgroundColor = '#444';
            button.style.color = 'white';
            button.style.border = '1px solid #777';
            button.style.borderRadius = '3px';
            button.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.instructionProvider.setFieldValue(field.id, input.value);
                this.instructionProvider.runAction(field.actionId);
                this.render();
            };
            fieldArea.appendChild(button);
        }

        return fieldArea;
    }

    createStatus(statusData) {
        const status = document.createElement('div');
        status.style.fontSize = '12px';
        status.style.maxWidth = '420px';
        status.style.textAlign = 'center';
        status.style.color = statusData.tone === 'error' ? '#ff8a80' : '#b7f7c5';
        status.innerText = statusData.text;
        return status;
    }

    createActions(actions) {
        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '8px';
        controls.style.flexWrap = 'wrap';
        controls.style.justifyContent = 'center';

        for (const action of actions) {
            const button = document.createElement('button');
            button.innerText = action.label;
            button.style.padding = '4px 10px';
            button.style.cursor = 'pointer';
            button.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.instructionProvider.runAction(action.id);
                this.render();
            };
            controls.appendChild(button);
        }

        return controls;
    }

    createOutput(outputData) {
        const output = document.createElement('textarea');
        output.readOnly = outputData.readOnly !== false;
        output.value = outputData.value;
        output.placeholder = outputData.placeholder || '';
        output.style.width = '420px';
        output.style.height = '180px';
        output.style.backgroundColor = '#1e1e1e';
        output.style.color = '#f5f5f5';
        output.style.border = '1px solid #555';
        output.style.borderRadius = '4px';
        output.style.padding = '8px';
        return output;
    }

    render() {
        this.container.innerHTML = '';

        const snapshot = this.instructionProvider.getSnapshot();
        if (!snapshot.visible) {
            this.container.style.display = "none";
            return;
        }
        
        this.container.style.display = "flex";
        this.container.style.flexDirection = "column";
        this.container.style.alignItems = "center";
        this.container.style.gap = "8px";

        this.container.appendChild(this.createInstructionTitle(snapshot.title));
        this.container.appendChild(this.createInstructionText(snapshot.instruction));

        if (snapshot.status) {
            this.container.appendChild(this.createStatus(snapshot.status));
        }

        for (const field of snapshot.fields) {
            this.container.appendChild(this.createField(field));
        }

        if (snapshot.actions.length > 0) {
            this.container.appendChild(this.createActions(snapshot.actions));
        }

        if (snapshot.output) {
            this.container.appendChild(this.createOutput(snapshot.output));
        }
    }
}