import * as THREE from "./../technical/build/three.module.js";
import { DrawBoard } from "./DrawBoard.js";
import { PointTool } from "./tools/PointTool.js";
import { LineTool } from "./tools/LineTool.js";
import { Circle3PTool } from "./tools/Circle3PTool.js";
import { Circle3TTool } from "./tools/Circle3TTool.js";
import { Circle2T1RTool } from "./tools/Circle2T1RTool.js";
import { LengthMeasurementTool } from "./tools/LengthMeasurementTool.js";
import { AngleMeasurementTool } from "./tools/AngleMeasurementTool.js";
import { RadiusMeasurementTool } from "./tools/RadiusMeasurementTool.js";
import { DrawLine } from "./shapes/DrawLine.js";
import { DrawCircle } from "./shapes/DrawCircle.js";
import { Point } from "./shapes/Point.js";
import { Vec4 } from "./Camera.js";

export const MouseState = { NONE: - 1, POINT: 0, LINE: 1, SELECT: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4, MOVE: 5, CIRCLE: 6, CIRCLE_3P: 7, CIRCLE_2T1R: 8, CIRCLE_3T: 9, MEASURE_LENGTH: 10, MEASURE_ANGLE: 11, MEASURE_RADIUS: 12 };

export class MouseControl{

    buttonState 
    drawBoard
    downPosition
    mousePressed
    movePos
    
    // Tools
    pointTool
    lineTool
    circle3PTool
    circle3TTool
    circle2T1RTool
    lengthMeasurementTool
    angleMeasurementTool
    radiusMeasurementTool

    constructor(parentDiv,drawBoard){
        this.buttonState = MouseState.NONE
        this.getMenu(parentDiv)
        this.drawBoard = drawBoard
        
        // Instantiate tools with reference to the constraint system
        this.pointTool = new PointTool(drawBoard, drawBoard.constraintSystem);
        this.lineTool = new LineTool(drawBoard, drawBoard.constraintSystem);
        this.circle3PTool = new Circle3PTool(drawBoard, drawBoard.constraintSystem);
        this.circle3TTool = new Circle3TTool(drawBoard, drawBoard.constraintSystem);
        this.circle2T1RTool = new Circle2T1RTool(drawBoard, drawBoard.constraintSystem);
        this.lengthMeasurementTool = new LengthMeasurementTool(drawBoard, drawBoard.constraintSystem);
        this.angleMeasurementTool = new AngleMeasurementTool(drawBoard, drawBoard.constraintSystem);
        this.radiusMeasurementTool = new RadiusMeasurementTool(drawBoard, drawBoard.constraintSystem);

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
        this.downPosition = position;
        this.movePos = {
            exist : false,
            dist : 9999,
            obj : null,
            x : position.x,
            y : position.y
        }
        
        if(this.buttonState == MouseState.SELECT){
            this.drawBoard.selectObject(position.x,position.y)
        }
        this.mousePressed = true
    }

    mouseMove(position){
        
        // Update the cursor position to display it in the top right
        this.drawBoard.setCursorPos(position.x, position.y);

        this.drawBoard.clearTempObjects();

        // Always show trailing lines for 3-Point circle if we have active points selected
        if (this.buttonState === MouseState.CIRCLE_3P && this.circle3PTool.selectedPoints.length > 0) {
            let lastPointId = this.circle3PTool.selectedPoints[this.circle3PTool.selectedPoints.length - 1];
            let data = this.drawBoard.constraintSystem.geometries.get(lastPointId).data;
            
            let p1Obj = new Point(this.drawBoard.context, this.drawBoard.camera, new Vec4(data.x, data.y, 0, 1));
            let currentWorldVec = this.drawBoard.camera.getWorldVec(position.x, position.y);
            let mousePtObj = new Point(this.drawBoard.context, this.drawBoard.camera, new Vec4(currentWorldVec.x, currentWorldVec.y, 0, 1));
            
            let trackingLine = new DrawLine(this.drawBoard.context, this.drawBoard.camera, p1Obj, mousePtObj);
            trackingLine.color = "blue";
            this.drawBoard.drawTempObjects.push(trackingLine);
            this.drawBoard.draw();
        }

        if(this.mousePressed){
            let currentPosObj = this.drawBoard.selectStartObject(position.x,position.y);
            
            if(this.buttonState == MouseState.LINE){
                // Fix preview snapping: Pull start/end from selectStartObject live checking to match visual snap
                let preStart = this.drawBoard.selectStartObject(this.downPosition.x, this.downPosition.y, ["Point"]);
                let startWorld = preStart.exist && preStart.obj ? preStart.obj.vec4.mulMatrix(this.drawBoard.camera.getCalcMatrix()) : this.drawBoard.camera.getWorldVec(this.downPosition.x, this.downPosition.y);
                
                let preEnd = this.drawBoard.selectStartObject(position.x, position.y, ["Point"]);
                let endWorld = preEnd.exist && preEnd.obj ? preEnd.obj.vec4.mulMatrix(this.drawBoard.camera.getCalcMatrix()) : this.drawBoard.camera.getWorldVec(position.x, position.y);
                
                // Unapply the camera matrix visually to get proper world space context to give to Point
                if (preStart.exist && preStart.obj) startWorld = new Vec4(preStart.obj.vec4.x, preStart.obj.vec4.y, 0, 1);
                if (preEnd.exist && preEnd.obj) endWorld = new Vec4(preEnd.obj.vec4.x, preEnd.obj.vec4.y, 0, 1);
                
                let p1 = new Point(this.drawBoard.context, this.drawBoard.camera, new Vec4(startWorld.x, startWorld.y, 0, 1));
                let p2 = new Point(this.drawBoard.context, this.drawBoard.camera, new Vec4(endWorld.x, endWorld.y, 0, 1));
                
                let tempLine = new DrawLine(this.drawBoard.context, this.drawBoard.camera, p1, p2);
                tempLine.color = "gray"; // preview color
                this.drawBoard.drawTempObjects.push(tempLine);
                this.drawBoard.draw();
            }
            else if(this.buttonState == MouseState.CIRCLE){
                let preStart = this.drawBoard.selectStartObject(this.downPosition.x, this.downPosition.y, ["Point"]);
                let startWorld = preStart.exist && preStart.obj ? preStart.obj.vec4.mulMatrix(this.drawBoard.camera.getCalcMatrix()) : this.drawBoard.camera.getWorldVec(this.downPosition.x, this.downPosition.y);
                
                let preEnd = this.drawBoard.selectStartObject(position.x, position.y, ["Point"]);
                let endWorld = preEnd.exist && preEnd.obj ? preEnd.obj.vec4.mulMatrix(this.drawBoard.camera.getCalcMatrix()) : this.drawBoard.camera.getWorldVec(position.x, position.y);
                
                // Unapply camera matrix for exact world snap positioning
                if (preStart.exist && preStart.obj) startWorld = new Vec4(preStart.obj.vec4.x, preStart.obj.vec4.y, 0, 1);
                if (preEnd.exist && preEnd.obj) endWorld = new Vec4(preEnd.obj.vec4.x, preEnd.obj.vec4.y, 0, 1);

                let p1 = new Point(this.drawBoard.context, this.drawBoard.camera, new Vec4(startWorld.x, startWorld.y, 0, 1));
                
                let dist = Math.sqrt(Math.pow(endWorld.x - startWorld.x, 2) + Math.pow(endWorld.y - startWorld.y, 2));
                
                let tempCircle = new DrawCircle(this.drawBoard.context, this.drawBoard.camera, p1, dist);
                tempCircle.color = "gray"; // preview color
                this.drawBoard.drawTempObjects.push(tempCircle);
                this.drawBoard.draw();
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
        else {
            if (this.buttonState === MouseState.MEASURE_LENGTH) {
                this.lengthMeasurementTool.onMouseMove(position.x, position.y);
            }
            if (this.buttonState === MouseState.MEASURE_ANGLE) {
                this.angleMeasurementTool.onMouseMove(position.x, position.y);
            }
            if (this.buttonState === MouseState.MEASURE_RADIUS) {
                this.radiusMeasurementTool.onMouseMove(position.x, position.y);
            }
            // Give hover hint when not holding mouse down for drawing tools
            if ([MouseState.LINE, MouseState.CIRCLE, MouseState.CIRCLE_3P, MouseState.POINT, MouseState.CIRCLE_3T, MouseState.CIRCLE_2T1R, MouseState.MEASURE_ANGLE, MouseState.MEASURE_LENGTH, MouseState.MEASURE_RADIUS].includes(this.buttonState)) {
                this.drawBoard.selectObject(position.x, position.y);
            }
            // Draw anyway so the mouse tracker cursor coordinates update
            this.drawBoard.draw();
        }
    }

    mouseClicked(position) {
        if(this.buttonState == MouseState.POINT){
            this.pointTool.onCanvasClick(position.x, position.y);
        }
        else if (this.buttonState == MouseState.CIRCLE_3P) {
            this.circle3PTool.onCanvasClick(position.x, position.y);
            if (this.onStateChange) this.onStateChange();
        }
        else if (this.buttonState == MouseState.CIRCLE_3T) {
            let allowedTargets = ["DrawLine", "DrawCircle"];
            let snappedPt = this.drawBoard.selectStartObject(position.x, position.y, allowedTargets);
            if (snappedPt.exist && snappedPt.obj) {
                this.circle3TTool.onShapeSelected(snappedPt.obj);
                if (this.onStateChange) this.onStateChange();
            }
        }
        else if (this.buttonState == MouseState.CIRCLE_2T1R) {
            let allowedTargets = ["DrawLine", "DrawCircle"];
            if (this.circle2T1RTool.step === "selectLines") {
                let snappedPt = this.drawBoard.selectStartObject(position.x, position.y, allowedTargets);
                if (snappedPt.exist && snappedPt.obj) {
                    this.circle2T1RTool.onShapeSelected(snappedPt.obj);
                    if (this.onStateChange) this.onStateChange();
                }
            } else if (this.circle2T1RTool.step === "placeRadiusHint") {
                this.circle2T1RTool.tempRadius = this.commandRadius; // Inject manual radius
                this.circle2T1RTool.onCanvasClick(position.x, position.y);
                if (this.onStateChange) this.onStateChange();
            }
        }
        
        if(this.buttonState == MouseState.SELECT){
            this.drawBoard.selectObject(position.x,position.y)
        }
        else if (this.buttonState == MouseState.MEASURE_LENGTH) {
            this.lengthMeasurementTool.onCanvasClick(position.x, position.y);
            if (this.onStateChange) this.onStateChange();
        }
        else if (this.buttonState == MouseState.MEASURE_ANGLE) {
            this.angleMeasurementTool.onCanvasClick(position.x, position.y);
            if (this.onStateChange) this.onStateChange();
        }
        else if (this.buttonState == MouseState.MEASURE_RADIUS) {
            this.radiusMeasurementTool.onCanvasClick(position.x, position.y);
            if (this.onStateChange) this.onStateChange();
        }
        
        // Auto-save memory on click actions
        this.drawBoard.saveState();
    }

    forceComplete2T1R() {
        if (this.buttonState === MouseState.CIRCLE_2T1R && this.circle2T1RTool.step === "placeRadiusHint") {
            this.circle2T1RTool.tempRadius = this.commandRadius;
            this.circle2T1RTool.onCanvasClick(this.drawBoard.canvas.clientWidth / 2, this.drawBoard.canvas.clientHeight / 2);
            if (this.onStateChange) this.onStateChange();
            this.drawBoard.saveState();
        }
    }

    mouseUp(position) {
        this.mousePressed = false
        this.drawBoard.clearTempObjects(); // Clean out previews
        
        // Finalize standard creation
        if(this.buttonState == MouseState.LINE){
            this.lineTool.onCanvasClick(this.downPosition.x, this.downPosition.y); // start
            this.lineTool.onCanvasClick(position.x, position.y); // end
        }
        if(this.buttonState == MouseState.CIRCLE){
            // Fix: Re-use snapped points for Circle Center and Edge
            let startSnapped = this.drawBoard.selectStartObject(this.downPosition.x, this.downPosition.y, ["Point"]);
            let endSnapped = this.drawBoard.selectStartObject(position.x, position.y, ["Point"]);
            
            let startWorld = startSnapped.exist && startSnapped.obj ? 
                startSnapped.obj.vec4.mulMatrix(this.drawBoard.camera.getCalcMatrix()) : 
                this.drawBoard.camera.getWorldVec(this.downPosition.x, this.downPosition.y);
                
            let endWorld = endSnapped.exist && endSnapped.obj ? 
                endSnapped.obj.vec4.mulMatrix(this.drawBoard.camera.getCalcMatrix()) : 
                this.drawBoard.camera.getWorldVec(position.x, position.y);

            // Handle start point (Center)
            let centerId;
            let centerPObj;
            if (startSnapped.exist && startSnapped.obj && startSnapped.obj.constructor.name === "Point") {
                centerPObj = startSnapped.obj;
                centerId = centerPObj.constraintId;
                startWorld = new Vec4(centerPObj.vec4.x, centerPObj.vec4.y, 0, 1);
            } else {
                centerId = this.drawBoard.constraintSystem.addGeometry({ type: "Point", data: { x: startWorld.x, y: startWorld.y }, fixed: false });
                centerPObj = new Point(this.drawBoard.context, this.drawBoard.camera, new Vec4(startWorld.x, startWorld.y, 0, 1));
                centerPObj.constraintId = centerId;
                this.drawBoard.drawObjects.push(centerPObj);
            }

            // Quick inline circle tool porting for standard circle creation
            let dist = Math.sqrt(Math.pow(endWorld.x - startWorld.x, 2) + Math.pow(endWorld.y - startWorld.y, 2));
            let circId = this.drawBoard.constraintSystem.addGeometry({ type: "Circle", data: { center: centerId, r: dist }, fixed: false });
            
            let cObj = new DrawCircle(this.drawBoard.context, this.drawBoard.camera, centerPObj, dist);
            cObj.constraintId = circId;
            this.drawBoard.drawObjects.push(cObj);

            // If we snapped to an end point, link them mathematically!
            if (endSnapped.exist && endSnapped.obj && endSnapped.obj.constructor.name === "Point") {
                this.drawBoard.constraintSystem.addConstraint({
                    type: "Coincident", targets: [endSnapped.obj.constraintId, circId]
                });
            }
            
            this.drawBoard.clearTempObjects();
            this.drawBoard.draw(); // FIX: Trigger screen repaint immediately so we don't have to hit F5
        }
        
        // Auto-save on drag release
        this.drawBoard.saveState();
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

        let buttonMeasureLength = document.createElement("Button")
        buttonMeasureLength.innerText = "Measure Length"
        buttonMeasureLength.addEventListener( 'click',()=>{
            this.setState(MouseState.MEASURE_LENGTH);
        });

        let buttonMeasureAngle = document.createElement("Button")
        buttonMeasureAngle.innerText = "Measure Angle"
        buttonMeasureAngle.addEventListener( 'click',()=>{
            this.setState(MouseState.MEASURE_ANGLE);
        });

        let buttonMeasureRadius = document.createElement("Button")
        buttonMeasureRadius.innerText = "Measure Radius"
        buttonMeasureRadius.addEventListener( 'click',()=>{
            this.setState(MouseState.MEASURE_RADIUS);
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

        let measureGroup = document.createElement("div");
        measureGroup.style.border = "1px solid #ccc";
        measureGroup.style.padding = "5px";
        measureGroup.style.margin = "5px";
        measureGroup.style.display = "inline-flex";
        measureGroup.style.flexDirection = "column";
        measureGroup.innerText = "Measure";
        measureGroup.style.fontSize = "12px";

        measureGroup.appendChild(buttonMeasureLength);
        measureGroup.appendChild(buttonMeasureAngle);
        measureGroup.appendChild(buttonMeasureRadius);

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
        menudiv.appendChild( measureGroup );
        menudiv.appendChild( buttonESC );
        menudiv.appendChild( buttonSelect );

        parentDiv.appendChild(menudiv)
        

    }


}