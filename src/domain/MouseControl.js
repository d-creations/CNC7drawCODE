import * as THREE from "./../technical/build/three.module.js";
import { DrawBoard } from "./DrawBoard.js";
import { PointTool } from "./tools/PointTool.js";
import { LineTool } from "./tools/LineTool.js";
import { Circle3PTool } from "./tools/Circle3PTool.js";
import { Circle3TTool } from "./tools/Circle3TTool.js";
import { Circle2T1RTool } from "./tools/Circle2T1RTool.js";
import { LengthMeasurementTool } from "./tools/LengthMeasurementTool.js";
import { HorizontalMeasurementTool } from "./tools/HorizontalMeasurementTool.js";
import { VerticalMeasurementTool } from "./tools/VerticalMeasurementTool.js";
import { AngleMeasurementTool } from "./tools/AngleMeasurementTool.js";
import { RadiusMeasurementTool } from "./tools/RadiusMeasurementTool.js";
import { ArcCenterTool } from "./tools/ArcCenterTool.js";
import { Arc3PTool } from "./tools/Arc3PTool.js";
import { CircleTool } from "./tools/CircleTool.js";
import { DrawLine } from "./shapes/DrawLine.js";
import { DrawCircle } from "./shapes/DrawCircle.js";
import { Point } from "./shapes/Point.js";
import { Vec4 } from "./Camera.js";
import { HitTester } from "./renderers/HitTester.js";

export const MouseState = { NONE: - 1, POINT: 0, LINE: 1, SELECT: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4, MOVE: 5, CIRCLE: 6, CIRCLE_3P: 7, CIRCLE_2T1R: 8, CIRCLE_3T: 9, MEASURE_LENGTH: 10, MEASURE_ANGLE: 11, MEASURE_RADIUS: 12, PASTE: 13, ARC: 14, ARC_3P: 15, MEASURE_HORIZONTAL: 16, MEASURE_VERTICAL: 17 };

export class MouseControl{

    buttonState 
    drawBoard
    downPosition
    mousePressed
    movePos
    
    // Tools
    pointTool
    lineTool
    circleTool
    circle3PTool
    circle3TTool
    circle2T1RTool
    lengthMeasurementTool
    horizontalMeasurementTool
    verticalMeasurementTool
    angleMeasurementTool
    radiusMeasurementTool

    constructor(parentDiv,drawBoard){
        this.buttonState = MouseState.SELECT
        this.drawBoard = drawBoard
        
        // Instantiate tools with reference to the constraint system
        this.pointTool = new PointTool(drawBoard, drawBoard.constraintSystem);
        this.lineTool = new LineTool(drawBoard, drawBoard.constraintSystem);
        this.circleTool = new CircleTool(drawBoard, drawBoard.constraintSystem);
        this.circle3PTool = new Circle3PTool(drawBoard, drawBoard.constraintSystem);
        this.circle3TTool = new Circle3TTool(drawBoard, drawBoard.constraintSystem);
        this.circle2T1RTool = new Circle2T1RTool(drawBoard, drawBoard.constraintSystem);
        this.lengthMeasurementTool = new LengthMeasurementTool(drawBoard, drawBoard.constraintSystem);
        this.horizontalMeasurementTool = new HorizontalMeasurementTool(drawBoard, drawBoard.constraintSystem);
        this.verticalMeasurementTool = new VerticalMeasurementTool(drawBoard, drawBoard.constraintSystem);
        this.angleMeasurementTool = new AngleMeasurementTool(drawBoard, drawBoard.constraintSystem);
        this.radiusMeasurementTool = new RadiusMeasurementTool(drawBoard, drawBoard.constraintSystem);
        this.arcCenterTool = new ArcCenterTool(drawBoard, drawBoard.constraintSystem);
        this.arc3PTool = new Arc3PTool(drawBoard, drawBoard.constraintSystem);

        this.mousePressed = false
        this.tempPoints = [];
        this.tempLines = [];
        this.commandRadius = 20; // Default radius input
        this.draggingAnchor = null; // { shape }
        this.onStateChange = null; 
    }

    setState(newState) {
        this.buttonState = newState;
        this.tempPoints = [];
        this.tempLines = [];

    // Clear any selection when switching tools so PropertyEditor hides and items deselect
    if (this.drawBoard) {
        if (this.drawBoard.hoverObj) {
            let objs = Array.isArray(this.drawBoard.hoverObj) ? this.drawBoard.hoverObj : [this.drawBoard.hoverObj];
            for (let obj of objs) {
                if (obj && obj.changeColor) obj.changeColor("red");
            }
        }
        this.drawBoard.hoverObj = null;
        this.drawBoard.selectedObjects = [];
        if (this.drawBoard.onSelectionChanged) {
            this.drawBoard.onSelectionChanged(null);
        }
        this.drawBoard.draw();
    }

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
        
        // Handle explicit Right click to move functionality dynamically across tools 
        if (position.button === 2) {
            this.preRightClickState = this.buttonState;
            this.buttonState = MouseState.MOVE;
        }

        if(this.buttonState == MouseState.SELECT){
            // Prefer snapping to Point anchors first (including ephemeral anchors created for textAnchor)
            const pointHit = this.drawBoard.selectStartObject(position.x, position.y, ["Point"]);
            let closest = { dist: Infinity, shape: null };
            if (pointHit.exist && pointHit.obj && pointHit.obj.isTextAnchor) {
                const parent = this.drawBoard.drawObjects.find(o => o.constraintId === pointHit.obj.parentMeasurementId);
                if (parent && parent.isMeasurement) {
                    closest.shape = parent;
                    closest.dist = pointHit.dist;
                }
            }

            // Fallback: check measurement anchor arcs
            if (!closest.shape) {
                for (let obj of this.drawBoard.drawObjects) {
                    if (!obj.isMeasurement) continue;
                    const res = HitTester.hitTestWithInstruction(obj.getRenderData(), position.x, position.y, this.drawBoard.camera);
                    if (res.instruction && res.dist < this.drawBoard.selectDistLampda) {
                        if (res.instruction.primitive === 'arc' && res.instruction.fill) {
                            if (res.dist < closest.dist) {
                                closest.dist = res.dist;
                                closest.shape = obj;
                            }
                        }
                    }
                }
            }

            if (closest.shape) {
                // Start dragging the anchor
                // begin grouped history so drag counts as one undo step
                if (this.drawBoard && this.drawBoard.historyManager && typeof this.drawBoard.historyManager.startBatch === 'function') {
                    this.drawBoard.historyManager.startBatch();
                }
                this.draggingAnchor = { shape: closest.shape };
                this.drawBoard.selectedObjects = [closest.shape];
                if (this.drawBoard.onSelectionChanged) this.drawBoard.onSelectionChanged(closest.shape);
            } else {
                this.drawBoard.selectObject(position.x,position.y)
            }
        }
        this.mousePressed = true
    }

    mouseMove(position){
        
        // Update the cursor position to display it in the top right
        this.drawBoard.setCursorPos(position.x, position.y);

        this.drawBoard.clearTempObjects();

        if (this.buttonState === MouseState.PASTE) {
            let worldVec = this.drawBoard.camera.getWorldVec(position.x, position.y);
            let previews = this.drawBoard.clipboardManager.getPreviewObjects(worldVec.x, worldVec.y);
            for (let p of previews) {
                this.drawBoard.drawTempObjects.push(p);
            }
            this.drawBoard.draw();
            return;
        }

        // Always show trailing lines for 3-Point circle if we have active points selected
        if (this.buttonState === MouseState.CIRCLE_3P && this.circle3PTool.selectedPoints.length > 0) {
            let lastPointId = this.circle3PTool.selectedPoints[this.circle3PTool.selectedPoints.length - 1];
            let data = this.drawBoard.constraintSystem.geometries.get(lastPointId).data;
            let p1Obj = new Point(new Vec4(data.x, data.y, 0, 1));
            let currentWorldVec = this.drawBoard.camera.getWorldVec(position.x, position.y);
            let mousePtObj = new Point(new Vec4(currentWorldVec.x, currentWorldVec.y, 0, 1));
            let trackingLine = new DrawLine(p1Obj, mousePtObj);
            trackingLine.color = "blue";
            this.drawBoard.drawTempObjects.push(trackingLine);
            this.drawBoard.draw();
        }

        if(this.mousePressed){
            if (this.draggingAnchor && this.draggingAnchor.shape) {
                // Update anchor position to current world mouse
                let world = this.drawBoard.camera.getWorldVec(position.x, position.y);
                this.draggingAnchor.shape.textAnchor = { x: world.x, y: world.y };
                this.drawBoard.draw();
                return;
            }

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

                let p1 = new Point(new Vec4(startWorld.x, startWorld.y, 0, 1));
                let p2 = new Point(new Vec4(endWorld.x, endWorld.y, 0, 1));

                let tempLine = new DrawLine(p1, p2);
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

                let p1 = new Point(new Vec4(startWorld.x, startWorld.y, 0, 1));

                let dist = Math.sqrt(Math.pow(endWorld.x - startWorld.x, 2) + Math.pow(endWorld.y - startWorld.y, 2));

                let tempCircle = new DrawCircle(p1, dist);
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
                if (!this.drawBoard.selectionBox) {
                    this.drawBoard.selectionBox = { active: true, startX: this.downPosition.x, startY: this.downPosition.y, endX: position.x, endY: position.y };
                } else {
                    this.drawBoard.selectionBox.endX = position.x;
                    this.drawBoard.selectionBox.endY = position.y;
                }
                
                // Real-time preview of selection colors while dragging
                this.drawBoard.selectObjectsInArea(
                    this.drawBoard.selectionBox.startX,
                    this.drawBoard.selectionBox.startY,
                    this.drawBoard.selectionBox.endX,
                    this.drawBoard.selectionBox.endY,
                    true // previewOnly flag skip heavy UI reconstruction
                );
                
                this.drawBoard.draw();
            }
        }
        else {
            if (this.buttonState === MouseState.MEASURE_LENGTH) {
                this.lengthMeasurementTool.onMouseMove(position.x, position.y);
            }
            if (this.buttonState === MouseState.MEASURE_HORIZONTAL) {
                this.horizontalMeasurementTool.onMouseMove(position.x, position.y);
            }
            if (this.buttonState === MouseState.MEASURE_VERTICAL) {
                this.verticalMeasurementTool.onMouseMove(position.x, position.y);
            }
            if (this.buttonState === MouseState.MEASURE_ANGLE) {
                this.angleMeasurementTool.onMouseMove(position.x, position.y);
            }
            if (this.buttonState === MouseState.MEASURE_RADIUS) {
                this.radiusMeasurementTool.onMouseMove(position.x, position.y);
            }
            if (this.buttonState === MouseState.ARC) {
                this.arcCenterTool.onMouseMove(position);
            }
            if (this.buttonState === MouseState.ARC_3P) {
                this.arc3PTool.onMouseMove(position);
            }
            // Give hover hint when not holding mouse down for drawing tools
            if ([MouseState.SELECT, MouseState.LINE, MouseState.CIRCLE, MouseState.CIRCLE_3P, MouseState.POINT, MouseState.CIRCLE_3T, MouseState.CIRCLE_2T1R, MouseState.MEASURE_ANGLE, MouseState.MEASURE_LENGTH, MouseState.MEASURE_HORIZONTAL, MouseState.MEASURE_VERTICAL, MouseState.MEASURE_RADIUS, MouseState.ARC, MouseState.ARC_3P].includes(this.buttonState)) {
                this.drawBoard.hoverObject(position.x, position.y);
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
            let dragDist = Math.hypot(position.x - this.downPosition.x, position.y - this.downPosition.y);
            if (dragDist < 5) {
                this.drawBoard.selectObject(position.x,position.y)
            }
        }
        else if (this.buttonState == MouseState.MEASURE_LENGTH) {
            this.lengthMeasurementTool.onCanvasClick(position.x, position.y);
            if (this.onStateChange) this.onStateChange();
        }
        else if (this.buttonState == MouseState.MEASURE_HORIZONTAL) {
            this.horizontalMeasurementTool.onCanvasClick(position.x, position.y);
            if (this.onStateChange) this.onStateChange();
        }
        else if (this.buttonState == MouseState.MEASURE_VERTICAL) {
            this.verticalMeasurementTool.onCanvasClick(position.x, position.y);
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
        else if (this.buttonState == MouseState.ARC) {
            this.arcCenterTool.onCanvasClick(position.x, position.y);
            if (this.onStateChange) this.onStateChange();
        }
        else if (this.buttonState == MouseState.ARC_3P) {
            this.arc3PTool.onCanvasClick(position.x, position.y);
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
        
        if(this.buttonState == MouseState.SELECT && this.drawBoard.selectionBox && this.drawBoard.selectionBox.active){
            // Box selection complete
            this.drawBoard.selectObjectsInArea(
                this.drawBoard.selectionBox.startX, 
                this.drawBoard.selectionBox.startY, 
                this.drawBoard.selectionBox.endX, 
                this.drawBoard.selectionBox.endY
            );
            this.drawBoard.selectionBox = null;
            this.drawBoard.draw();
        }

        this.drawBoard.clearTempObjects(); // Clean out previews

        // Finalize any anchor drag
            if (this.draggingAnchor && this.draggingAnchor.shape) {
            const shape = this.draggingAnchor.shape;
            if (this.drawBoard.constraintSystem) {
                if (shape.textAnchorPointId) {
                    let pGeo = this.drawBoard.constraintSystem.geometries.get(shape.textAnchorPointId);
                    if (pGeo && pGeo.data) {
                        if (isFinite(shape.textAnchor.x)) pGeo.data.x = Number(shape.textAnchor.x);
                        if (isFinite(shape.textAnchor.y)) pGeo.data.y = Number(shape.textAnchor.y);
                        // Reflect moved coords back into the in-memory shape so rendering is immediate
                        if (isFinite(pGeo.data.x) && isFinite(pGeo.data.y)) {
                            shape.textAnchor = { x: Number(pGeo.data.x), y: Number(pGeo.data.y) };
                        }
                    }
                } else if (shape.constraintId) {
                    let geo = this.drawBoard.constraintSystem.geometries.get(shape.constraintId);
                    if (geo && geo.data) {
                        // Only write numeric values
                        if (!geo.data.textAnchor) geo.data.textAnchor = {};
                        if (isFinite(shape.textAnchor.x)) geo.data.textAnchor.x = Number(shape.textAnchor.x);
                        if (isFinite(shape.textAnchor.y)) geo.data.textAnchor.y = Number(shape.textAnchor.y);
                        // Update any ephemeral visual anchor created during loadState
                        const pObj = this.drawBoard.drawObjects.find(o => o.isTextAnchor && o.parentMeasurementId === shape.constraintId);
                        if (pObj && pObj.vec4) {
                            if (isFinite(shape.textAnchor.x)) pObj.vec4.x = Number(shape.textAnchor.x);
                            if (isFinite(shape.textAnchor.y)) pObj.vec4.y = Number(shape.textAnchor.y);
                        }
                    }
                }
            }
                // Save final state (will be coalesced into a single history entry if batching)
                this.drawBoard.saveState();
                if (this.drawBoard && this.drawBoard.historyManager && typeof this.drawBoard.historyManager.endBatch === 'function') {
                    this.drawBoard.historyManager.endBatch();
                }
                this.draggingAnchor = null;
        }
        
        if(this.buttonState === MouseState.MOVE && this.preRightClickState !== undefined) {
            this.buttonState = this.preRightClickState;
            this.preRightClickState = undefined;
            return;
        }
        
        // Finalize standard creation
        if(this.buttonState === MouseState.PASTE) {
            let worldPos = this.drawBoard.camera.getWorldVec(position.x, position.y);
            this.drawBoard.clipboardManager.insertClipboard(worldPos.x, worldPos.y);
            this.setState(MouseState.SELECT); // Reset back to select after dropping
        } else if(this.buttonState == MouseState.LINE){
            this.lineTool.onCanvasClick(this.downPosition.x, this.downPosition.y); // start
            this.lineTool.onCanvasClick(position.x, position.y); // end
        }
        if(this.buttonState == MouseState.CIRCLE){
            this.circleTool.onCanvasClick(this.downPosition.x, this.downPosition.y); // center
            this.circleTool.onCanvasClick(position.x, position.y); // edge
            this.drawBoard.clearTempObjects();
            this.drawBoard.draw();
        }
        
        // Auto-save on drag release
        this.drawBoard.saveState();
    }

}