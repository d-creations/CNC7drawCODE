
import { MouseControl, MouseState } from './MouseControl.js';
import { DrawBoard } from '../core/DrawBoard.js';
import { Camera } from './Camera.js';
import { PropertyEditor } from './PropertyEditor.js';
import { CommandPanel } from './CommandPanel.js';
import { KeyboardManager } from './KeyboardManager.js';



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
       position.button = e.button;
       return position;
     }

    constructor(parentDiv, preCreatedDrawBoard, injectedContainer, injectedCamera) {
        var DView = parentDiv.appendChild(document.createElement("div"));
        DView.id = "DView_Menu";

        // Connect the injected container (Canvas) to the DOM
        let container = parentDiv.appendChild(injectedContainer);
        container.classList.add("container");
        container.id = 'container';
        container.height = 800;
        container.width = 800;
        container.style.height = "800px";
        container.style.width = "800px";
        container.style.backgroundColor = "whitesmoke";

        let camera = injectedCamera;
        camera.moveX(container.width / 2);
        camera.moveY(container.height / 2);
        
        // Dependancy Injection! We observe the pre-created Document.
        this.drawBoard = preCreatedDrawBoard;
        
        this.mousecontrol = new MouseControl(DView, this.drawBoard);
        this.commandPanel = new CommandPanel(parentDiv, this.mousecontrol);
        this.keyboardManager = new KeyboardManager(this.mousecontrol, this.drawBoard);

        let barDiv = document.getElementById("bar");
        this.propertyEditor = new PropertyEditor(parentDiv, this.drawBoard);
        this.drawBoard.onSelectionChanged = (obj) => {
            if (this.mousecontrol && this.mousecontrol.buttonState !== MouseState.SELECT) {
                // If we are not in SELECT mode, do not show properties on hover.
                this.propertyEditor.setObject(null);
            } else {
                this.propertyEditor.setObject(obj);
            }
        }

        let that = this
        this.container = container
        container.addEventListener( 'contextmenu',(e)=>{ e.preventDefault(); }  );
        container.addEventListener( 'click',(e)=>{that.mousecontrol.mouseClicked(that.getPosition(e))}  );
        container.addEventListener( 'mousedown',(e)=>{that.mousecontrol.mouseDown(that.getPosition(e))}  );
        container.addEventListener( 'mouseup',(e)=>{that.mousecontrol.mouseUp(that.getPosition(e))}  );
        container.addEventListener( 'mousemove',(e)=>{that.mousecontrol.mouseMove(that.getPosition(e))}  );
        container.innerHeight = 800;
        container.innerWidth = 800;

    }

    
}

