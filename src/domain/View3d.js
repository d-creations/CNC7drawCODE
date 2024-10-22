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



export class View3D{

     static scene;
     static camera;
     static controls;
     container
     mousecontrol
     drawBoard

     getPosition(e){

       let position = {};
        this.container.innerHeight
        this.container.innerWidth
        position.x = ((e.clientX- this.container.offsetLeft )-(this.container.offsetWidth /2))   ;
        position.y = -((e.clientY -this.container.offsetTop ) -(this.container.offsetHeight /2));

        position.x =(e.clientX- this.container.offsetLeft )
        position.y = (e.clientY -this.container.offsetTop ) 
        //console.log(View3D.camera.mat

        return position
     }
    constructor(parentDiv) {
        var DView = parentDiv.appendChild(document.createElement("div"));
        DView.id = "DView_Menu";
        let camera = new Camera()
        let container = parentDiv.appendChild(document.createElement("canvas"))
        this.drawBoard = new DrawBoard(container,camera)
        this.mousecontrol = new MouseControl(DView,this.drawBoard)
        container.classList.add("container")
        container.id ='container';
        container.height = 400
        container.width = 400
        let that = this
        this.container = container
        container.addEventListener( 'click',(e)=>{that.mousecontrol.mouseClicked(that.getPosition(e))}  );
        container.addEventListener( 'mousedown',(e)=>{that.mousecontrol.mouseDown(that.getPosition(e))}  );
        container.addEventListener( 'mouseup',(e)=>{that.mousecontrol.mouseUp(that.getPosition(e))}  );
        container.addEventListener( 'mousemove',(e)=>{that.mousecontrol.mouseMove(that.getPosition(e))}  );
        container.innerHeight = 400;
        container.innerWidth = 400;

    }

    
}

