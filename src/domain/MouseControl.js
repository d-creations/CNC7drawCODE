
import * as THREE from "./../technical/build/three.module.js";
import { DrawBoard } from "./DrawBoard.js";



export const MouseState = { NONE: - 1, POINT: 0, LINE: 1, SELECT: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4, MOVE: 5 };



export class MouseControl{

    buttonState 
    drawBoard
    downPosition
    mousePressed
    movePos
    constructor(parentDiv,drawBoard){
        this.buttonState = MouseState.NONE
        this.getMenu(parentDiv)
        this.drawBoard= drawBoard
        this.mousePressed = false

    }

    mouseDown(position){
        this.downPosition = {
            exist : false,
            dist : 9999,
            obj : null,
            x : 9999,
            y : 9999
        }
        
        this.movePos = {
            exist : false,
            dist : 9999,
            obj : null,
            x : position.x,
            y : position.y
        }
        this.downPosition = this.drawBoard.selectStartObject(position.x,position.y)
        if(this.buttonState == MouseState.SELECT){
            this.drawBoard.selectObject(position.x,position.y)
        }
        console.log("mouse mouse down")
        console.log(position)
        this.mousePressed = true
    }

    mouseMove(position){
        
        // Update the cursor position to display it in the top right
        this.drawBoard.setCursorPos(position.x, position.y);

        if(this.mousePressed){
            console.log("mouse pressed")
            console.log(position)            
            if(this.buttonState == MouseState.LINE){
                this.drawBoard.drawTempLine(this.downPosition,this.drawBoard.selectStartObject(position.x,position.y))
            }
          
            else if(this.buttonState == MouseState.MOVE){
                let deltaX = this.movePos.x - position.x
                let deltaY = this.movePos.y - position.y
                this.drawBoard.moveX(-deltaX)
                this.drawBoard.moveY(-deltaY)
                this.movePos = position
            }
            else if(this.buttonState == MouseState.SELECT){
                this.drawBoard.selectObject(position.x,position.y)
            }
        }
       // console.log("mouse moved")
       // console.log(position)
    }

    mouseClicked(position) {
        console.log("mouse Clicked")
        console.log(position)
        if(this.buttonState == MouseState.POINT){

            this.drawBoard.drawPoint(position.x,position.y) 
        }
        
        if(this.buttonState == MouseState.SELECT){
            this.drawBoard.selectObject(position.x,position.y)
        }
    }

    mouseUp(position) {
        console.log("mouse UP")
        console.log(position)
        this.mousePressed = false
        if(this.buttonState == MouseState.LINE){
            this.drawBoard.drawLine(this.downPosition,this.drawBoard.selectStartObject(position.x,position.y))
        }
    }

    getMenu(parentDiv){
        let that = this
        let menudiv = document.createElement("div")
        let buttonClear = document.createElement("Button")
        buttonClear.innerText   = "Clear"
        buttonClear.addEventListener( 'click',()=>{
            that.buttonState = MouseState.NONE
            this.drawBoard.clearAll()
        }  );
        let buttonPoint = document.createElement("Button")
        buttonPoint.innerText = "Point"
        buttonPoint.addEventListener( 'click',()=>{that.buttonState = MouseState.POINT}  );
        let buttonLine = document.createElement("Button")
        buttonLine.innerText = "Line"
        buttonLine.addEventListener( 'click',()=>{that.buttonState = MouseState.LINE}  );
        let buttonESC = document.createElement("Button")
        buttonESC.innerText = "ESC"
        buttonESC.addEventListener( 'click',()=>{that.buttonState = MouseState.NONE}  );
        let buttonSelect = document.createElement("Button")
        buttonSelect.innerText = "Select"
        buttonSelect.addEventListener( 'click',()=>{that.buttonState = MouseState.SELECT}  );

        let buttonMove = document.createElement("Button")
        buttonMove.innerText = "Move"
        buttonMove.addEventListener( 'click',()=>{that.buttonState = MouseState.MOVE}  );

        let buttonZoomIn = document.createElement("Button")
        buttonZoomIn.innerText = "+"
        buttonZoomIn.addEventListener( 'click',()=>{this.drawBoard.zoom(1.2)}  );

        let buttonZoomOut = document.createElement("Button")
        buttonZoomOut.innerText = "-"
        buttonZoomOut.addEventListener( 'click',()=>{this.drawBoard.zoom(1/1.2)}  );

        menudiv.appendChild( buttonMove );
        menudiv.appendChild( buttonZoomIn );
        menudiv.appendChild( buttonZoomOut );

        menudiv.appendChild( buttonClear );
        menudiv.appendChild( buttonPoint );
        menudiv.appendChild( buttonLine );
        menudiv.appendChild( buttonESC );
        menudiv.appendChild( buttonSelect );

        parentDiv.appendChild(menudiv)
        

    }


}