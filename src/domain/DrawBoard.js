import { Vec4 } from "./Camera.js"
import { stickFont } from "./LetterDrawer.js"
import { AppConfig } from "./Config.js"
import { ConstraintSystem } from "./constraints/ConstraintSystem.js"
import { LocalSketchStorage } from "./storage/LocalSketchStorage.js"
import { Point } from "./shapes/Point.js"
import { DrawLine } from "./shapes/DrawLine.js"
import { DrawCircle } from "./shapes/DrawCircle.js"
import { LengthMeasurementShape } from "./shapes/LengthMeasurementShape.js"
import { AngleMeasurementShape } from "./shapes/AngleMeasurementShape.js"
import { RadiusMeasurementShape } from "./shapes/RadiusMeasurementShape.js"

let selectedobj = {
    exist : false,
    dist : 9999,
    obj : null,
    x : 9999,
    y : 9999
}

export class DrawBoard{

    context
    canvas
    drawObjects
    drawTempObjects    
    selectDistLampda
    hoverObj
    camera
    constraintSystem
    storage

    constructor(canvas,camera){
        this.camera = camera
        this.context = canvas.getContext("2d")
        this.canvas = canvas
        this.drawObjects = []
        this.drawTempObjects = []    
        this.selectDistLampda = 10.0
        this.cursorPos = { x: 0, y: 0 }
        
        this.constraintSystem = new ConstraintSystem()
        this.storage = new LocalSketchStorage()
        
        // Auto-load state if the browser has cached shapes
        this.loadState()
        
        this.draw()
        this.hoverObj = null

    }

    setCursorPos(x, y) {
        let worldPos = this.camera.getWorldVec(x, y);

        this.cursorPos.x = worldPos.x;
        this.cursorPos.y = -worldPos.y; // Inverted Y-axis assuming classic CNC coordinate where up is positive
        this.draw();
    }

    drawPoint(x,y){
        // Migrated to Point.create
    }

    moveX(delta){
        this.camera.moveX(delta)
        this.draw()
    }

    moveY(delta){
        this.camera.moveY(delta)
        this.draw()
    }

    zoom(factor){
        let cx = this.canvas.width / 2;
        let cy = this.canvas.height / 2;
        this.camera.zoom(factor, cx, cy);
        this.draw();
    }

    selectStartObject(_x,_y, allowedTypes = ["Point"]){
        let selectedobj = {
            exist : false,
            dist : 9999,
            obj : null,
            x : _x,
            y : _y
        }
        for(let mainObj of this.drawObjects){
            let objectsToCheck = [mainObj];
            if (typeof mainObj.getSubObjects === 'function') {
                objectsToCheck = objectsToCheck.concat(mainObj.getSubObjects());
            }

            for(let obj of objectsToCheck){
                if (!allowedTypes.includes(obj.constructor.name)) continue; // snap filter
                let dist = obj.check(_x,_y)
                if(dist < this.selectDistLampda){
                    if(selectedobj.dist > dist){
                        selectedobj.obj = obj
                        // If it's a point, we snap exactly to its vec4, else just use the closest mouse point for lines
                        if (obj.constructor.name === "Point") {
                            let camPos = obj.vec4 ? obj.vec4.mulMatrix(this.camera.getCalcMatrix()) : {x:0, y:0};
                            selectedobj.x = camPos.x
                            selectedobj.y = camPos.y
                        } else {
                            selectedobj.x = _x;
                            selectedobj.y = _y;
                        }
                        selectedobj.dist = dist
                        selectedobj.exist = true;
                    }
                }
            }
        }
        return selectedobj;
    }
    selectObject(x,y){
        
        let previousHoverObj = this.hoverObj;
        this.hoverObj = null;
        let selectedobj = {
            dist : 9999,
            obj : null
        }
        for(let mainObj of this.drawObjects){
            mainObj.changeColor("red") // Reset main object color
            
            let objectsToCheck = [mainObj];
            if (typeof mainObj.getSubObjects === 'function') {
                objectsToCheck = objectsToCheck.concat(mainObj.getSubObjects());
            }

            for(let obj of objectsToCheck){
                if (obj !== mainObj && typeof obj.changeColor === 'function') {
                    // Note: Sub-objects like Tangent points override their color in draw(), 
                    // but we can reset them here just in case.
                    obj.changeColor("blue");
                }
                let dist = obj.check(x,y)
                if(dist < this.selectDistLampda){
                    if(selectedobj.dist > dist){
                        selectedobj.obj = obj
                        selectedobj.exist = true
                        selectedobj.dist = dist
                    }
                }
            }
        }
        if(selectedobj.dist < this.selectDistLampda){
            // Color for the selected/hovered object
            selectedobj.obj.changeColor("green")
            this.hoverObj = selectedobj.obj;
        }
        
        if (this.onSelectionChanged && previousHoverObj !== this.hoverObj) {
            this.onSelectionChanged(this.hoverObj);
        }

        this.draw()
    }

    drawLine(startObject,endObject){
        // migrated
    }

    drawTempLine(startObject,endObject){
        // migrated      
    }

    // Circle logic successfully migrated out to DrawCircle, DrawCircle3P, DrawCircle3T, DrawCircle2T1R.

    clearTempObjects(){
        this.drawTempObjects = []
    }

    deleteObject(objToRemove){
        // 1. Remove from math JSON and get all recursively deleted dependent objects
        let removedConstraintIds = [];
        if (objToRemove.constraintId) {
            removedConstraintIds = this.constraintSystem.removeGeometry(objToRemove.constraintId);
        }
        
        // 2. Filter out the original object AND any cascading dependent visuals (like orphaned Lines/Circles)
        this.drawObjects = this.drawObjects.filter(obj => {
            if (obj === objToRemove) return false;
            if (obj.constraintId && removedConstraintIds.includes(obj.constraintId)) return false;
            return true;
        });

        // 3. Clear Hover object if it was deleted
        if(this.hoverObj === objToRemove || (this.hoverObj && removedConstraintIds.includes(this.hoverObj.constraintId))) {
            this.hoverObj = null;
            if(this.onSelectionChanged) {
                this.onSelectionChanged(null);
            }
        }
        
        this.draw();
        this.saveState();
    }

    clearAll(){
        this.drawObjects = []
        this.clearTempObjects()
        this.constraintSystem.load({ geometries: [], constraints: [] }); // wipe physics
        this.storage.clear();
        this.draw()
    }

    // =======================================================
    // LOCAL STORAGE AUTOSAVE / HYDRATION
    // =======================================================

    saveState() {
        if (!this.constraintSystem) return;
        const data = this.constraintSystem.exportJSON();
        this.storage.save(data);
    }

    loadState() {
        const storedData = this.storage.load();
        if (!storedData || !storedData.geometries || storedData.geometries.length === 0) return;

        this.constraintSystem.load(storedData);
        let uiMap = new Map(); // Links JSON IDs to Visual objects

        // Pass 1: Build Visual Points first
        for (const geo of storedData.geometries) {
            if (geo.type === "Point") {
                let pObj = new Point(this.context, this.camera, new Vec4(geo.data.x, geo.data.y, 0, 1));
                pObj.constraintId = geo.id;
                uiMap.set(geo.id, pObj);
                this.drawObjects.push(pObj);
            }
        }

        // Pass 2: Connect Lines and Circles to the Visual Points
        for (const geo of storedData.geometries) {
            if (geo.type === "Line") {
                let p1 = uiMap.get(geo.data.start);
                let p2 = uiMap.get(geo.data.end);
                if (p1 && p2) {
                    let lObj = new DrawLine(this.context, this.camera, p1, p2);
                    lObj.constraintId = geo.id;
                    this.drawObjects.push(lObj);
                }
            } else if (geo.type === "Circle") {
                let centerPoint = uiMap.get(geo.data.center);
                if (centerPoint) {
                    let cObj = new DrawCircle(this.context, this.camera, centerPoint, geo.data.r);
                    cObj.constraintId = geo.id;
                    this.drawObjects.push(cObj);
                }
            } else if (geo.type === "LengthMeasurement") {
                let p1 = this.drawObjects.find(o => o.constraintId === geo.data.p1Id) || geo.data.p1;
                let p2 = this.drawObjects.find(o => o.constraintId === geo.data.p2Id) || geo.data.p2;
                if (p1 && p2) {
                    let LM = new LengthMeasurementShape(this, p1, p2);
                    LM.constraintId = geo.id;
                    if (geo.data.offset !== undefined) LM.offset = geo.data.offset;
                    this.drawObjects.push(LM);
                }
            } else if (geo.type === "AngleMeasurement") {
                // Try to find the lines in drawObjects
                let l1 = this.drawObjects.find(o => o.constraintId === geo.data.l1Id);
                let l2 = this.drawObjects.find(o => o.constraintId === geo.data.l2Id);
                if (l1 && l2) {
                    let AM = new AngleMeasurementShape(this, l1, l2);
                    AM.constraintId = geo.id;
                    if (geo.data.radius !== undefined) AM.radius = geo.data.radius;
                    this.drawObjects.push(AM);
                }
            } else if (geo.type === "RadiusMeasurement") {
                let circ = this.drawObjects.find(o => o.constraintId === geo.data.circleId);
                if (circ) {
                    let RM = new RadiusMeasurementShape(this, circ);
                    RM.constraintId = geo.id;
                    if (geo.data.angle !== undefined) RM.angle = geo.data.angle;
                    if (geo.data.offset !== undefined) RM.offset = geo.data.offset;
                    this.drawObjects.push(RM);
                }
            }
        }
    }

    draw(){
        // Pre-render sync step: Pull absolute coordinates from Constraint System geometry to view logic
        if (this.constraintSystem && this.constraintSystem.geometries) {
            for (let obj of this.drawObjects) {
                if (obj.constraintId) {
                    let geoData = this.constraintSystem.geometries.get(obj.constraintId)?.data;
                    if (geoData) {
                        if (obj.constructor.name === "Point") {
                            if (!obj.vec4) obj.vec4 = new Vec4(0,0,0,1);
                            obj.vec4.x = geoData.x;
                            obj.vec4.y = geoData.y;
                        } 
                        else if (obj.constructor.name === "DrawCircle") {
                            let centerData = this.constraintSystem.geometries.get(geoData.center)?.data;
                            if (centerData) {
                                obj.centerPoint.vec4.x = centerData.x;
                                obj.centerPoint.vec4.y = centerData.y;
                            }
                            obj.radius = geoData.r;
                        }
                        else if (obj.constructor.name === "DrawLine") {
                            let startData = this.constraintSystem.geometries.get(geoData.start)?.data;
                            let endData = this.constraintSystem.geometries.get(geoData.end)?.data;
                            if (startData) {
                                obj.startPoint.vec4.x = startData.x;
                                obj.startPoint.vec4.y = startData.y;
                            }
                            if (endData) {
                                obj.endpoint.vec4.x = endData.x;
                                obj.endpoint.vec4.y = endData.y;
                            }
                        }
                    }
                }
            }
        }

        // Set background color
        this.context.fillStyle = "whitesmoke";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for(let obj of this.drawObjects){
            obj.draw()
        }
        for(let obj of this.drawTempObjects){
            obj.draw()
        }

        // Dynamic center point axis (crosses origin 0,0)
        let xStart = new Vec4(-100,0,0,1)
        let xEnd = new Vec4(100,0,0,1)
        let camxStart = xStart.mulMatrix(this.camera.getCalcMatrix())
        let camxEnd = xEnd.mulMatrix(this.camera.getCalcMatrix())

        this.context.beginPath();
        this.context.moveTo(camxStart.x,camxStart.y);
        this.context.lineTo(camxEnd.x, camxEnd.y);
        this.context.strokeStyle = "black"
        this.context.stroke();    

        // y
        let yStart = new Vec4(0,-100,0,1)
        let yEnd = new Vec4(0,100,0,1)
        let camyStart = yStart.mulMatrix(this.camera.getCalcMatrix())
        let camyEnd = yEnd.mulMatrix(this.camera.getCalcMatrix())

        this.context.beginPath();
        this.context.moveTo(camyStart.x, camyStart.y);
        this.context.lineTo(camyEnd.x, camyEnd.y);
        this.context.strokeStyle = "black"
        this.context.stroke();    

        // Draw X and Y Labels for dynamic axis
        let drawLabel = (char, x, y, size) => {
            const strokes = stickFont[char];
            if (!strokes) return;
            this.context.beginPath();
            for (let stroke of strokes) {
                const [p1, p2] = stroke;
                let v1 = new Vec4(x + p1[0]*size, y + p1[1]*size, 0, 1).mulMatrix(this.camera.getCalcMatrix());
                let v2 = new Vec4(x + p2[0]*size, y + p2[1]*size, 0, 1).mulMatrix(this.camera.getCalcMatrix());
                this.context.moveTo(v1.x, v1.y);
                this.context.lineTo(v2.x, v2.y);
            }
            this.context.strokeStyle = "black";
            this.context.stroke();
        };

        drawLabel('X', 105, -5, 10);
        drawLabel('Y', -5, 105, 10);

        // Draw cursor coordinates top right
        let drawStringStatic = (text, startX, startY, size, color="red") => {
            let currentX = startX;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === ' ') {
                    currentX += size * 1.5;
                    continue;
                }
                const strokes = stickFont[char];
                if (strokes) {
                    this.context.beginPath();
                    for (let stroke of strokes) {
                        const [p1, p2] = stroke;
                        this.context.moveTo(currentX + p1[0]*size, startY + p1[1]*size);
                        this.context.lineTo(currentX + p2[0]*size, startY + p2[1]*size);
                    }
                    this.context.strokeStyle = color; // Colored drawing
                    this.context.stroke();
                }
                currentX += size * 1.5;
            }
        };

        // Static top-left axis coordinate system
        this.context.beginPath();
        this.context.moveTo(30, 30);
        this.context.lineTo(80, 30); // X axis line
        this.context.moveTo(30, 30);
        this.context.lineTo(30, 80); // Y axis line
        this.context.strokeStyle = "blue";
        this.context.lineWidth = 2;
        this.context.stroke();
        this.context.lineWidth = 1; // Reset line width
        
        // Static labels for top-left axis
        drawStringStatic("X", 90, 25, 10, "blue");
        drawStringStatic("Y", 25, 90, 10, "blue");

        // Use dynamic precision based on the config file
        const precision = AppConfig.drawBoard.coordPrecision;
        const width = this.canvas.width || 800;
        const textStr = `X${this.cursorPos.x.toFixed(precision)} Y${this.cursorPos.y.toFixed(precision)}`;
        drawStringStatic(textStr, width - 200, 20, 10, "red");
    }
}