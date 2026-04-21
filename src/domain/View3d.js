/**
 * autor : roth 
 * date : 2024
 * 
 * IDEAdapter 
 * 
 * A CNC Editor for multiply Canals  
 *              it uses a 3dView to plot proram code 
 *              e Console to print CNC Program errors for the User
*               
* Lizenz:
* MIT License

Copyright (c) 2024 damian-roth Switzerland

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

* 
 */





import { MouseControl } from "./MouseControl.js";
import { DrawBoard } from "./DrawBoard.js";
import { Camera } from "./Camera.js";
import { PropertyEditor } from "./PropertyEditor.js";
import { CommandPanel } from "./CommandPanel.js";



export class View3D{

     static scene;
     static camera;
     static controls;
     container
     mousecontrol
     drawBoard

     getPosition(e){
       let position = {};
       position.x = e.offsetX;
       position.y = e.offsetY;
       return position;
     }
    constructor(parentDiv) {
        let container = parentDiv.appendChild(document.createElement("canvas"))
        container.classList.add("container")
        container.id ='container';
        container.height = 800
        container.width = 800
        container.style.height = "800px" // Ensure CSS size is constrained correctly
        container.style.width = "800px"
        container.style.backgroundColor = "whitesmoke"

        var DView = parentDiv.appendChild(document.createElement("div"));
        DView.id = "DView_Menu";

        
        let camera = new Camera()
        // Center the 0,0 coordinate in the middle of the canvas
        // The default View 0,0 is at top-left. Offsetting by half width/height makes 0,0 the center.
        camera.moveX(container.width / 2)
        camera.moveY(container.height / 2)
        
        this.drawBoard = new DrawBoard(container,camera)
        this.mousecontrol = new MouseControl(DView,this.drawBoard)
        this.commandPanel = new CommandPanel(parentDiv, this.mousecontrol);

        let barDiv = document.getElementById("bar");
        this.propertyEditor = new PropertyEditor(parentDiv, this.drawBoard);
        this.drawBoard.onSelectionChanged = (obj) => {
            this.propertyEditor.setObject(obj);
        }

        let that = this
        this.container = container
        container.addEventListener( 'click',(e)=>{that.mousecontrol.mouseClicked(that.getPosition(e))}  );
        container.addEventListener( 'mousedown',(e)=>{that.mousecontrol.mouseDown(that.getPosition(e))}  );
        container.addEventListener( 'mouseup',(e)=>{that.mousecontrol.mouseUp(that.getPosition(e))}  );
        container.addEventListener( 'mousemove',(e)=>{that.mousecontrol.mouseMove(that.getPosition(e))}  );
        container.innerHeight = 800;
        container.innerWidth = 800;

    }

    
}

