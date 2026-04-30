import { AppConfig } from "./Config.js";

/**
 * Handles the UI for editing properties of the currently selected drawing object.
 */
export class PropertyEditor {
    constructor(parentDiv, drawBoard) {
        this.parentDiv = parentDiv;
        this.drawBoard = drawBoard;
        
        this.container = document.createElement('div');
        this.container.className = "property-editor";
        this.container.style.position = "absolute";
        this.container.style.top = "20px";
        this.container.style.left = "20px";
        this.container.style.border = "1px solid #ccc";
        this.container.style.padding = "10px";
        this.container.style.boxShadow = "2px 2px 10px rgba(0,0,0,0.2)";
        this.container.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
        this.container.style.minHeight = "150px";
        this.container.style.display = "none";
        this.container.style.zIndex = "1000";

        this.parentDiv.style.position = "relative";
        this.parentDiv.appendChild(this.container);
        
        this.selectedObject = null;
        this.render();
    }
    
    setObject(obj) {
        if (this.selectedObject === obj) return;
        this.selectedObject = obj;
        this.render();
    }
    
    render() {
        this.container.innerHTML = '';
        if (!this.selectedObject) {
             this.container.style.display = "none";
             return;
        }
        this.container.style.display = "block";
        
        let title = document.createElement('h3');
        
        let btnOk = document.createElement('button');
        btnOk.innerText = "OK ✓";
        btnOk.style.backgroundColor = "#4CAF50";
        btnOk.style.color = "white";
        btnOk.style.border = "none";
        btnOk.style.padding = "4px 12px";
        btnOk.style.marginRight = "5px";
        btnOk.style.cursor = "pointer";
        btnOk.onclick = () => {
            // Apply all focused elements just in case
            if (document.activeElement && document.activeElement.tagName === "INPUT") {
                document.activeElement.blur();
            }
            // Close the property editor by deselecting the object
            this.setObject(null);
        }

        // Refresh Button simply forces a redraw and re-render if updated
        let btnRefresh = document.createElement('button');
        btnRefresh.innerText = "Refresh View";
        btnRefresh.style.marginRight = "5px";
        btnRefresh.style.padding = "4px 8px";
        btnRefresh.onclick = () => {
            this.drawBoard.draw();
            this.render();
        }
        
        let btnDelete = document.createElement('button');
        btnDelete.innerText = "Delete";
        btnDelete.style.backgroundColor = "#ff4444";
        btnDelete.style.color = "white";
        btnDelete.style.border = "none";
        btnDelete.style.padding = "4px 8px";
        btnDelete.style.cursor = "pointer";
        btnDelete.onclick = () => {
            if (Array.isArray(this.selectedObject)) {
                for (let obj of this.selectedObject) {
                    this.drawBoard.deleteObject(obj);
                }
            } else {
                this.drawBoard.deleteObject(this.selectedObject);
            }
            this.setObject(null);
        }
        
        let btnCut = document.createElement('button');
        btnCut.innerText = "Cut";
        btnCut.style.backgroundColor = "#ff9800";
        btnCut.style.color = "white";
        btnCut.style.border = "none";
        btnCut.style.padding = "4px 8px";
        btnCut.style.marginLeft = "5px";
        btnCut.style.cursor = "pointer";
        btnCut.onclick = () => {
            let objsToCut = Array.isArray(this.selectedObject) ? this.selectedObject : [this.selectedObject];
            this.drawBoard.cutObjects(objsToCut);
            this.setObject(null);
        };

        if (Array.isArray(this.selectedObject) && this.selectedObject.length > 1) {
            // MULTI-SELECTION MODE
            title.innerText = this.selectedObject.length + " Objects Selected";
            title.style.marginTop = "0";
            this.container.appendChild(title);
            
            let btnArea = document.createElement('div');
            btnArea.style.marginTop = "15px";
            btnArea.style.display = "flex";
            btnArea.style.gap = "8px";
            btnArea.appendChild(btnDelete);
            btnArea.appendChild(btnCut);
            
            let closeBtn = document.createElement('button');
            closeBtn.innerText = "Cancel";
            closeBtn.onclick = () => this.setObject(null);
            btnArea.appendChild(closeBtn);
            
            this.container.appendChild(btnArea);
            return;
        }

        // SINGLE OBJECT MODE
        let activeObj = Array.isArray(this.selectedObject) ? this.selectedObject[0] : this.selectedObject;

        title.innerText = activeObj.constructor.name + " Properties";
        title.style.marginTop = "0";
        this.container.appendChild(title);

        if (typeof activeObj.buildProperties === "function") {
            activeObj.buildProperties(this);
        }
        
        // Allow color changing for testing standard properties
        let colorDivArea = document.createElement('div');
        let colorLabel = document.createElement('label');
        colorLabel.innerText = "Color: ";
        colorLabel.style.display = "inline-block";
        colorLabel.style.width = "80px";

        let colorInput = document.createElement('input');
        colorInput.type = "text"; 
        colorInput.value = activeObj.color;
        
        let lastAppliedColor = activeObj.color;
        const applyColor = (e) => {
            const currentVal = e.target.value;
            if (currentVal !== lastAppliedColor) {
                lastAppliedColor = currentVal;
                activeObj.defaultColor = currentVal; // save to default color
                activeObj.changeColor(currentVal);
                this.drawBoard.draw();
            }
        };

        colorInput.onchange = applyColor;
        colorInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault(); // prevent triggering default submit / Move button
                applyColor(e);
                e.target.blur();
            }
        });

        colorDivArea.style.marginTop = "10px";
        colorDivArea.appendChild(colorLabel);
        colorDivArea.appendChild(colorInput);
        this.container.appendChild(colorDivArea);

        let buttonArea = document.createElement('div');
        buttonArea.style.marginTop = "15px";
        buttonArea.style.display = "flex";
        buttonArea.style.flexWrap = "wrap";
        buttonArea.style.gap = "5px";
        buttonArea.appendChild(btnOk);
        buttonArea.appendChild(btnRefresh);
        buttonArea.appendChild(btnDelete);
        buttonArea.appendChild(btnCut);
        
        this.container.appendChild(buttonArea);
    }
    
    buildPointFields(pointObj, labelPrefix) {
        let divArea = document.createElement('div');
        divArea.style.marginBottom = "10px";
        divArea.style.padding = "5px";
        divArea.style.border = "1px solid #eee";
        divArea.innerHTML = `<h4 style="margin:0 0 5px 0">${labelPrefix}</h4>`;
        
        let xInput = this.createNumberField("X", pointObj.vec4.x, (val) => {
             pointObj.vec4.x = val;
             if (pointObj.constraintId) {
                 let geo = this.drawBoard.constraintSystem.geometries.get(pointObj.constraintId);
                 if (geo) {
                     geo.data.x = val;
                     this.drawBoard.saveState();
                 }
             }
             this.drawBoard.draw();
        });
        
        let yInput = this.createNumberField("Y", pointObj.vec4.y, (val) => {
             pointObj.vec4.y = val;
             if (pointObj.constraintId) {
                 let geo = this.drawBoard.constraintSystem.geometries.get(pointObj.constraintId);
                 if (geo) {
                     geo.data.y = val;
                     this.drawBoard.saveState();
                 }
             }
             this.drawBoard.draw();
        });
        
        divArea.appendChild(xInput);
        divArea.appendChild(yInput);
        this.container.appendChild(divArea);
    }

    createNumberField(name, value, onChangeCallback) {
        let div = document.createElement('div');
        div.style.marginBottom = "5px";

        let lbl = document.createElement('label');
        lbl.innerText = name + ": ";
        lbl.style.display = "inline-block";
        lbl.style.width = "40px";

        let inp = document.createElement('input');
        inp.type = "number";
        inp.step = AppConfig.drawBoard.minStep;
        
        // Show clean precision without infinite float trails in the input
        inp.value = parseFloat(value).toFixed(AppConfig.drawBoard.coordPrecision);
        
        let lastAppliedValue = parseFloat(value);
        const applyValue = (e) => {
            const currentVal = parseFloat(e.target.value);
            if (!isNaN(currentVal)) {
                lastAppliedValue = currentVal;
                // Debug: log numeric edits to help trace coordinate interpretation issues
                try {
                    console.debug("PropertyEditor.applyValue", { name, value: currentVal, objType: this.selectedObject ? this.selectedObject.constructor.name : null });
                } catch (err) {
                    // ignore logging errors in environments without console
                }
                onChangeCallback(currentVal);
            }
        };

        inp.onchange = applyValue;
        
        inp.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault(); // Stop bubbling which might click the first UI Button (Move)
                applyValue(e);
                e.target.blur();
            }
        });

        div.appendChild(lbl);
        div.appendChild(inp);
        return div;
    }
}