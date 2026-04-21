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
        title.innerText = this.selectedObject.constructor.name + " Properties";
        title.style.marginTop = "0";
        this.container.appendChild(title);
        
        if (this.selectedObject.constructor.name === "Point") {
             this.buildPointFields(this.selectedObject, "Position");
        } else if (this.selectedObject.constructor.name === "DrawLine") {
             this.buildPointFields(this.selectedObject.startPoint, "Start Point");
             this.buildPointFields(this.selectedObject.endpoint, "End Point");
        }
        
        // Allow color changing for testing standard properties
        let colorDivArea = document.createElement('div');
        let colorLabel = document.createElement('label');
        colorLabel.innerText = "Color: ";
        colorLabel.style.display = "inline-block";
        colorLabel.style.width = "80px";

        let colorInput = document.createElement('input');
        colorInput.type = "text"; 
        colorInput.value = this.selectedObject.color;
        colorInput.onchange = (e) => {
             this.selectedObject.changeColor(e.target.value);
             this.drawBoard.draw();
        };

        colorDivArea.style.marginTop = "10px";
        colorDivArea.appendChild(colorLabel);
        colorDivArea.appendChild(colorInput);
        this.container.appendChild(colorDivArea);
        
        // Refresh Button simply forces a redraw and re-render if updated
        let btnRefresh = document.createElement('button');
        btnRefresh.innerText = "Refresh View";
        btnRefresh.style.marginRight = "5px";
        btnRefresh.onclick = () => {
            this.drawBoard.draw();
            this.render();
        }
        
        let btnDelete = document.createElement('button');
        btnDelete.innerText = "Delete Object";
        btnDelete.style.backgroundColor = "#ff4444";
        btnDelete.style.color = "white";
        btnDelete.style.border = "none";
        btnDelete.style.padding = "2px 8px";
        btnDelete.style.cursor = "pointer";
        btnDelete.onclick = () => {
            this.drawBoard.deleteObject(this.selectedObject);
        }

        let buttonArea = document.createElement('div');
        buttonArea.style.marginTop = "15px";
        buttonArea.appendChild(btnRefresh);
        buttonArea.appendChild(btnDelete);
        
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
             this.drawBoard.draw();
        });
        
        let yInput = this.createNumberField("Y", pointObj.vec4.y, (val) => {
             pointObj.vec4.y = val;
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
        inp.onchange = (e) => {
           onChangeCallback(parseFloat(e.target.value));
        }

        div.appendChild(lbl);
        div.appendChild(inp);
        return div;
    }
}