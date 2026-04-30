import { MouseState } from './MouseControl.js';
import { ActionTypes, globalCommandRegistry } from '../core/CommandRegistry.js';

export class CommandPanel {
    constructor(parentDiv, mouseControl) {
        this.mouseControl = mouseControl;
        
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

        let measureGroup = document.createElement("div");
        measureGroup.style.border = "1px solid #ccc";
        measureGroup.style.padding = "5px";
        measureGroup.style.margin = "5px";
        measureGroup.style.display = "inline-flex";
        measureGroup.style.flexDirection = "column";
        measureGroup.innerText = "Measure";
        measureGroup.style.fontSize = "12px";

        measureGroup.appendChild(buttonMeasureLength);
        measureGroup.appendChild(buttonMeasureHorizontal);
        measureGroup.appendChild(buttonMeasureVertical);
        measureGroup.appendChild(buttonMeasureAngle);
        measureGroup.appendChild(buttonMeasureRadius);

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
        menudiv.appendChild(buttonUndo);
        menudiv.appendChild(buttonRedo);
        menudiv.appendChild(buttonZoomIn);
        menudiv.appendChild(buttonZoomOut);

        menudiv.appendChild(buttonClear);
        menudiv.appendChild(buttonPoint);
        menudiv.appendChild(buttonLine);
        menudiv.appendChild(circleGroup);
        menudiv.appendChild(measureGroup);
        menudiv.appendChild(buttonESC);
        menudiv.appendChild(buttonSelect);

        let dview = document.getElementById("DView_Menu");
        if (dview) {
            dview.appendChild(menudiv);
        } else {
            parentDiv.appendChild(menudiv);
        }
    }

    render() {
        this.container.innerHTML = '';
        
        let state = this.mouseControl.buttonState;
        if (state === MouseState.NONE || state === MouseState.SELECT || state === MouseState.MOVE) {
            this.container.style.display = "none";
            return;
        }
        
        this.container.style.display = "flex";
        this.container.style.flexDirection = "column";
        this.container.style.alignItems = "center";
        this.container.style.gap = "8px";

        let title = document.createElement('div');
        title.style.fontWeight = "bold";
        title.style.fontSize = "14px";
        title.style.textTransform = "uppercase";
        title.style.letterSpacing = "1px";
        
        let instruction = document.createElement('div');
        instruction.style.fontSize = "13px";
        instruction.style.color = "#ccc";

        if (state === MouseState.POINT) {
            title.innerText = "Tool: Point";
            instruction.innerText = "Click anywhere to place a point.";
        } else if (state === MouseState.LINE) {
            title.innerText = "Tool: Line";
            instruction.innerText = "Click and drag to draw a line.";
        } else if (state === MouseState.CIRCLE) {
            title.innerText = "Tool: Circle (Center + Radius)";
            instruction.innerText = "Click and drag to define center and radius.";
        } else if (state === MouseState.ARC) {
            title.innerText = "Tool: Arc (Center + Start + End)";
            let step = this.mouseControl.arcCenterTool.step;
            if (step === "placeCenter") instruction.innerText = "Step 1/3: Click to place Arc Center.";
            else if (step === "placeStart") instruction.innerText = "Step 2/3: Click to place Start Point / Radius.";
            else if (step === "placeEnd") instruction.innerText = "Step 3/3: Click to define End Angle.";
        } else if (state === MouseState.ARC_3P) {
            title.innerText = "Tool: 3-Point Arc";
            let step = this.mouseControl.arc3PTool.step;
            if (step === "placeStart") instruction.innerText = "Step 1/3: Click to place Start Point.";
            else if (step === "placeEnd") instruction.innerText = "Step 2/3: Click to place End Point.";
            else if (step === "placeRadius") instruction.innerText = "Step 3/3: Move mouse to define Arc Curvature and click.";
        } else if (state === MouseState.CIRCLE_3P) {
            title.innerText = "Tool: 3-Point Circle";
            let pts = this.mouseControl.circle3PTool.selectedPoints.length;
            if (pts === 0) instruction.innerText = "Step 1/3: Select 1st point";
            else if (pts === 1) instruction.innerText = "Step 2/3: Select 2nd point";
            else if (pts === 2) instruction.innerText = "Step 3/3: Select 3rd point (final)";
        } else if (state === MouseState.MEASURE_LENGTH) {
            title.innerText = "Tool: Measure Length";
            let step = this.mouseControl.lengthMeasurementTool.step;
            if (step === 0) instruction.innerText = "Step 1/2: Select start point";
            else instruction.innerText = "Step 2/2: Select end point";
        } else if (state === MouseState.MEASURE_HORIZONTAL) {
            title.innerText = "Tool: Measure Horizontal";
            let step = this.mouseControl.horizontalMeasurementTool.step;
            if (step === 0) instruction.innerText = "Step 1/2: Select start point";
            else instruction.innerText = "Step 2/2: Select end point";
        } else if (state === MouseState.MEASURE_VERTICAL) {
            title.innerText = "Tool: Measure Vertical";
            let step = this.mouseControl.verticalMeasurementTool.step;
            if (step === 0) instruction.innerText = "Step 1/2: Select start point";
            else instruction.innerText = "Step 2/2: Select end point";
        } else if (state === MouseState.MEASURE_ANGLE) {
            title.innerText = "Tool: Measure Angle";
            let step = this.mouseControl.angleMeasurementTool.step;
            if (step === 0) instruction.innerText = "Step 1/2: Select first line";
            else instruction.innerText = "Step 2/2: Select second line";
        } else if (state === MouseState.MEASURE_RADIUS) {
            title.innerText = "Tool: Measure Radius";
            instruction.innerText = "Click on a circle to measure its radius";
        } else if (state === MouseState.PASTE) {
            title.innerText = "Tool: Paste";
            instruction.innerText = "Move mouse to position clipboard objects, click to paste.";
        } else if (state === MouseState.CIRCLE_3T) {
            title.innerText = "Tool: 3-Tangent Circle";
            let lines = this.mouseControl.circle3TTool.selectedLines.length;
            if (lines === 0) instruction.innerText = "Step 1/3: Select 1st intersecting object";
            else if (lines === 1) instruction.innerText = "Step 2/3: Select 2nd intersecting object";
            else if (lines === 2) instruction.innerText = "Step 3/3: Select 3rd intersecting object (final)";
        } else if (state === MouseState.CIRCLE_2T1R) {
            title.innerText = "Tool: Circle (2 Tangents, 1 Radius)";
            let lines = this.mouseControl.circle2T1RTool.selectedLines.length;
            if (lines === 0) {
                instruction.innerText = "Step 1/3: Select 1st tangent object";
            } else if (lines === 1) {
                instruction.innerText = "Step 2/3: Select 2nd tangent object";
            } else if (lines === 2) {
                instruction.innerText = "Step 3/3: Click inside a quadrant to place circle.";
                
                let radiusInputArea = document.createElement('div');
                radiusInputArea.style.display = "flex";
                radiusInputArea.style.alignItems = "center";
                radiusInputArea.style.gap = "8px";
                radiusInputArea.style.marginTop = "5px";
                radiusInputArea.style.backgroundColor = "rgba(0,0,0,0.5)";
                radiusInputArea.style.padding = "5px 10px";
                radiusInputArea.style.borderRadius = "4px";
                
                let rLabel = document.createElement('span');
                rLabel.innerText = "Radius:";
                rLabel.style.fontSize = "13px";
                rLabel.style.fontWeight = "bold";
                
                let rInput = document.createElement('input');
                rInput.type = "number";
                rInput.value = this.mouseControl.commandRadius;
                rInput.style.width = "70px";
                rInput.style.padding = "2px 5px";
                rInput.style.border = "1px solid #555";
                rInput.style.borderRadius = "3px";
                rInput.style.backgroundColor = "#333";
                rInput.style.color = "white";
                rInput.onchange = (e) => {
                    let val = parseFloat(e.target.value);
                    if (val > 0) this.mouseControl.commandRadius = val;
                };
                rInput.addEventListener('keydown', (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        btnOk.click();
                    }
                });

                let btnOk = document.createElement('button');
                btnOk.innerText = "OK";
                btnOk.style.padding = "2px 8px";
                btnOk.style.cursor = "pointer";
                btnOk.style.backgroundColor = "#444";
                btnOk.style.color = "white";
                btnOk.style.border = "1px solid #777";
                btnOk.style.borderRadius = "3px";
                btnOk.onclick = (e) => {
                    e.stopPropagation(); // prevent canvas click
                    // Fire 2T1R creation using the center of the canvas / dummy hint point
                    this.mouseControl.forceComplete2T1R();
                };
                
                radiusInputArea.appendChild(rLabel);
                radiusInputArea.appendChild(rInput);
                radiusInputArea.appendChild(btnOk);
                
                this.container.appendChild(title);
                this.container.appendChild(instruction);
                this.container.appendChild(radiusInputArea);
                return; // Early return to append custom struct
            }
        }

        this.container.appendChild(title);
        this.container.appendChild(instruction);
    }
}