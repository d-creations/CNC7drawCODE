import * as THREE from "./../technical/build/three.module.js";
import { DrawBoard } from "./DrawBoard.js";
import { Point } from "./shapes/Point.js";
import { DrawLine } from "./shapes/DrawLine.js";
import { DrawCircle } from "./shapes/DrawCircle.js";
import { DrawCircle3P } from "./shapes/DrawCircle3P.js";
import { DrawCircle3T } from "./shapes/DrawCircle3T.js";
import { DrawCircle2T1R } from "./shapes/DrawCircle2T1R.js";



export const MouseState = { NONE: - 1, POINT: 0, LINE: 1, SELECT: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4, MOVE: 5, CIRCLE: 6, CIRCLE_3P: 7, CIRCLE_2T1R: 8, CIRCLE_3T: 9 };



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
        this.tempPoints = [];
        this.tempLines = [];
        this.commandRadius = 20; // Default radius input
        this.onStateChange = null; 
    }

    setState(newState) {
        this.buttonState = newState;
        this.tempPoints = [];
        this.tempLines = [];
        if (this.onStateChange) this.onStateChange();
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
        this.mousePressed = true
    }

    mouseMove(position){
        
        // Update the cursor position to display it in the top right
        this.drawBoard.setCursorPos(position.x, position.y);

        // Always show trailing lines for 3-Point circle if we have active points selected
        if (this.buttonState === MouseState.CIRCLE_3P && this.tempPoints.length > 0) {
            let currentPosObj = this.drawBoard.selectStartObject(position.x, position.y);
            DrawCircle3P.createTempTrack(this.drawBoard, this.tempPoints, currentPosObj);
        }

        if(this.mousePressed){
            if(this.buttonState == MouseState.LINE){
                DrawLine.createTemp(this.drawBoard, this.downPosition,this.drawBoard.selectStartObject(position.x,position.y))
            }
            else if(this.buttonState == MouseState.CIRCLE){
                DrawCircle.createTemp(this.drawBoard, this.downPosition,this.drawBoard.selectStartObject(position.x,position.y))
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
    }

    mouseClicked(position) {
        if(this.buttonState == MouseState.POINT){
            Point.create(this.drawBoard, position) 
        }
        else if (this.buttonState == MouseState.CIRCLE_3P) {
            let snappedPt = this.drawBoard.selectStartObject(position.x, position.y);
            this.tempPoints.push(snappedPt);
            
            if (this.tempPoints.length === 3) {
                DrawCircle3P.create(this.drawBoard, this.tempPoints[0], this.tempPoints[1], this.tempPoints[2]);
                this.tempPoints = []; // reset for next circle
            }
            if (this.onStateChange) this.onStateChange();
        }
        else if (this.buttonState == MouseState.CIRCLE_3T) {
            let allowedTargets = ["DrawLine", "DrawCircle", "DrawCircle3P", "DrawCircle3T", "DrawCircle2T1R"];
            let snappedPt = this.drawBoard.selectStartObject(position.x, position.y, allowedTargets);
            if (snappedPt.exist) {
                // Ensure we don't select the same shape twice
                if (!this.tempLines.includes(snappedPt.obj)) {
                    this.tempLines.push(snappedPt.obj);
                    snappedPt.obj.changeColor("blue"); // Temp visual feedback
                    this.drawBoard.draw();
                }
                
                if (this.tempLines.length === 3) {
                    DrawCircle3T.create(this.drawBoard, this.tempLines[0], this.tempLines[1], this.tempLines[2]);
                    this.tempLines = []; // reset for next circle
                }
                if (this.onStateChange) this.onStateChange();
            }
        }
        else if (this.buttonState == MouseState.CIRCLE_2T1R) {
            let allowedTargets = ["DrawLine", "DrawCircle", "DrawCircle3P", "DrawCircle3T", "DrawCircle2T1R"];
            // First 2 clicks are finding lines or circles
            if (this.tempLines.length < 2) {
                let snappedPt = this.drawBoard.selectStartObject(position.x, position.y, allowedTargets);
                if (snappedPt.exist && !this.tempLines.includes(snappedPt.obj)) {
                    this.tempLines.push(snappedPt.obj);
                    snappedPt.obj.changeColor("blue");
                    this.drawBoard.draw();
                    if (this.onStateChange) this.onStateChange();
                }
            } 
            // 3rd click is the location hint AND determines the initial radius!
            else {
                let hintPt = this.drawBoard.selectStartObject(position.x, position.y, ["Point"]);
                // Default to a raw mouse coordinate if they clicked empty space
                if (!hintPt.exist) {
                    let mVec = this.drawBoard.camera.getWorldVec(position.x, position.y);
                    hintPt.obj = { vec4: mVec, exist: false, x: position.x, y: position.y };
                }
                
                DrawCircle2T1R.create(this.drawBoard, this.tempLines[0], this.tempLines[1], hintPt, this.commandRadius);
                this.tempLines = []; // reset state for next attempt
                if (this.onStateChange) this.onStateChange();
            }
        }
        
        if(this.buttonState == MouseState.SELECT){
            this.drawBoard.selectObject(position.x,position.y)
        }
    }

    forceComplete2T1R() {
        if (this.buttonState === MouseState.CIRCLE_2T1R && this.tempLines.length === 2) {
            // Provide a hint pointing towards center screen explicitly.
            let hintPt = { 
                exist: false, 
                x: this.drawBoard.canvas.clientWidth / 2, 
                y: this.drawBoard.canvas.clientHeight / 2 
            };
            DrawCircle2T1R.create(this.drawBoard, this.tempLines[0], this.tempLines[1], hintPt, this.commandRadius);
            this.tempLines = []; 
            if (this.onStateChange) this.onStateChange();
        }
    }

    mouseUp(position) {
        this.mousePressed = false
        if(this.buttonState == MouseState.LINE){
            DrawLine.create(this.drawBoard, this.downPosition,this.drawBoard.selectStartObject(position.x,position.y))
        }
        if(this.buttonState == MouseState.CIRCLE){
            DrawCircle.create(this.drawBoard, this.downPosition, this.drawBoard.selectStartObject(position.x,position.y));
        }
    }

    getMenu(parentDiv){
        let that = this
        let menudiv = document.createElement("div")
        let buttonClear = document.createElement("Button")
        buttonClear.innerText   = "Clear"
        buttonClear.addEventListener( 'click',()=>{
            this.setState(MouseState.NONE);
            this.drawBoard.clearAll()
        }  );
        let buttonPoint = document.createElement("Button")
        buttonPoint.innerText = "Point"
        buttonPoint.addEventListener( 'click',()=>{this.setState(MouseState.POINT)}  );
        let buttonLine = document.createElement("Button")
        buttonLine.innerText = "Line"
        buttonLine.addEventListener( 'click',()=>{this.setState(MouseState.LINE)}  );
        
        let buttonCircle = document.createElement("Button")
        buttonCircle.innerText = "Circle (C+R)"
        buttonCircle.addEventListener( 'click',()=>{this.setState(MouseState.CIRCLE)}  );

        let buttonCircle3P = document.createElement("Button")
        buttonCircle3P.innerText = "Circle (3P)"
        buttonCircle3P.addEventListener( 'click',()=>{
            this.setState(MouseState.CIRCLE_3P);
        });

        let buttonCircle2TR = document.createElement("Button")
        buttonCircle2TR.innerText = "Circle (2T, 1R)"
        buttonCircle2TR.addEventListener( 'click',()=>{
            this.setState(MouseState.CIRCLE_2T1R);
        });

        let buttonCircle3T = document.createElement("Button")
        buttonCircle3T.innerText = "Circle (3T)"
        buttonCircle3T.addEventListener( 'click',()=>{
            this.setState(MouseState.CIRCLE_3T);
        });

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

        let buttonESC = document.createElement("Button")
        buttonESC.innerText = "ESC"
        buttonESC.addEventListener( 'click',()=>{this.setState(MouseState.NONE)}  );
        let buttonSelect = document.createElement("Button")
        buttonSelect.innerText = "Select"
        buttonSelect.addEventListener( 'click',()=>{this.setState(MouseState.SELECT)}  );

        let buttonMove = document.createElement("Button")
        buttonMove.innerText = "Move"
        buttonMove.addEventListener( 'click',()=>{this.setState(MouseState.MOVE)}  );

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
        menudiv.appendChild( circleGroup );
        menudiv.appendChild( buttonESC );
        menudiv.appendChild( buttonSelect );

        parentDiv.appendChild(menudiv)
        

    }


}