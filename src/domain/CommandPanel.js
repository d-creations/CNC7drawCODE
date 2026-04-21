import { MouseState } from "./MouseControl.js";

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
        } else if (state === MouseState.CIRCLE_3P) {
            title.innerText = "Tool: 3-Point Circle";
            let pts = this.mouseControl.tempPoints.length;
            if (pts === 0) instruction.innerText = "Step 1/3: Select 1st point";
            else if (pts === 1) instruction.innerText = "Step 2/3: Select 2nd point";
            else if (pts === 2) instruction.innerText = "Step 3/3: Select 3rd point (final)";
        } else if (state === MouseState.CIRCLE_3T) {
            title.innerText = "Tool: 3-Tangent Circle";
            let lines = this.mouseControl.tempLines.length;
            if (lines === 0) instruction.innerText = "Step 1/3: Select 1st intersecting line";
            else if (lines === 1) instruction.innerText = "Step 2/3: Select 2nd intersecting line";
            else if (lines === 2) instruction.innerText = "Step 3/3: Select 3rd intersecting line (final)";
        } else if (state === MouseState.CIRCLE_2T1R) {
            title.innerText = "Tool: Circle (2 Tangents, 1 Radius)";
            let lines = this.mouseControl.tempLines.length;
            if (lines === 0) {
                instruction.innerText = "Step 1/3: Select 1st tangent line";
            } else if (lines === 1) {
                instruction.innerText = "Step 2/3: Select 2nd tangent line";
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