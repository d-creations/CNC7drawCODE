
import * as THREE from "./../technical/build/three.module.js";
import { DrawBoard } from "./DrawBoard.js";



export const MouseState = { NONE: - 1, POINT: 0, LINE: 1, SELECT: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };



export class MouseControl{

    buttonState 
    drawBoard
    downPosition
    mousePressed
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
        this.downPosition = this.drawBoard.selectStartObject(position.x,position.y)
        console.log("mouse mouse down")
        console.log(position)
        this.mousePressed = true
    }

    mouseMove(position){

        if(this.mousePressed){
            console.log("mouse pressed")
            console.log(position)            
            if(this.buttonState == MouseState.LINE){
                this.drawBoard.drawTempLine(this.downPosition,this.drawBoard.selectStartObject(position.x,position.y))
            }
        }else{
            if(this.buttonState == MouseState.SELECT){
                this.drawBoard.selectObject(position.x,position.y)
            }
            if(this.buttonState == MouseState.LINE){   
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
            /*


            const geometry = new THREE.CircleGeometry( 1, 10 ); 
            geometry.translate(position.x,position.y,0)
            const material = new THREE.MeshBasicMaterial( { color: 0xcc00cc } ); 
            const circle = new THREE.Mesh( geometry, material ); 
            this.drawObject.push(circle)*/
            
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
        menudiv.appendChild( buttonClear );
        menudiv.appendChild( buttonPoint );
        menudiv.appendChild( buttonLine );
        menudiv.appendChild( buttonESC );
        menudiv.appendChild( buttonSelect );

        parentDiv.appendChild(menudiv)
        

    }


}