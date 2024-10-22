import { Vec4 } from "./Camera.js"




let selectedobj = {
    exist : false,
    dist : 9999,
    obj : null,
    x : 9999,
    y : 9999
}


export class DrawLine{

    ctx
    startPoint
    endpoint
    color
    camera

    constructor(ctx,camera,startPoint,endpoint){
        this.ctx = ctx
        this.startPoint = startPoint
        this.endpoint = endpoint
        this.color = "red"   
        this.camera = camera     
    }

    changeColor(color){
        this.color = color
    }
    draw(){
        
            let startPointcameraVec4 = this.startPoint.vec4.mulMatrix(this.camera.getCalcMatrix())
            let endPointcameraVec4 = this.endpoint.vec4.mulMatrix(this.camera.getCalcMatrix())
           // Define a new path
           this.ctx.beginPath();
           // Set a start-point
           this.ctx.moveTo(startPointcameraVec4.x,startPointcameraVec4.y);
           // Set an end-point
           this.ctx.lineTo(endPointcameraVec4.x, endPointcameraVec4.y);
           // Stroke it (Do the Drawing)
           this.ctx.strokeStyle = this.color
           this.ctx.stroke();    
        }
        check(x,y){
        let xV_ = this.endpoint.x -this.startPoint.x
        let yV_ = this.endpoint.y -this.startPoint.y
        let x2 = x - this.startPoint.x 
        let y2 = y - this.startPoint.y 
        
        console.log("Skalarprodukt")
        let SkalarPS = (xV_*x2 + yV_ * y2)/(Math.sqrt(xV_*xV_+yV_ * yV_) * Math.sqrt(x2*x2+y2 * y2))
        let distanceP = (xV_*y2 - yV_ * x2)/Math.sqrt(xV_*xV_+yV_ * yV_) 
        x2 = x -this.xE
        y2 = y-this.yE 
        let SkalarPE = (-xV_*x2 + -yV_ * y2)/(Math.sqrt(xV_*xV_+yV_ * yV_) * Math.sqrt(x2*x2+y2 * y2))
        if(SkalarPE < 0 || SkalarPS < 0){
            distanceP = 99999
        }
        return Math.sqrt(distanceP *distanceP)
    }
}

export class Point{

    ctx
    vec4
    color
    camera
    constructor(ctx,camera,vec4){
        this.ctx = ctx
        this.vec4 = vec4 
        this.color = "red"
        this.camera = camera
    }

    changeColor(color){
        this.color = color
    }


    draw(){
        let cameraVec4 = this.vec4.mulMatrix(this.camera.getCalcMatrix())
        this.ctx.beginPath();
        this.ctx.arc(cameraVec4.x,cameraVec4.y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.color;
        this.ctx.linfilleWidth = 4;
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();
    }
    check(x,y){
        let x_ = x-this.x
        let y_ = y-this.y

        return Math.sqrt(x_*x_ + y_*y_);
    }
}

export class DrawBoard{

    context
    canvas
    drawObjects
    drawTempObjects    
    selectDistLampda
    hoverObj
    camera

    constructor(canvas,camera){
        this.camera = camera
        this.context = canvas.getContext("2d")
        this.canvas = canvas
        this.drawObjects = []
        this.drawTempObjects = []    
        this.selectDistLampda = 10.0
        this.draw()
        this.hoverObj = null

    }

    drawPoint(x,y){
        this.drawObjects.push(new Point(this.context,this.camera,new Vec4(x,y,0,1)))
        this.draw()

    }

    moveX(delta){
        this.camera.moveX(delta)
        this.draw()
    }

    moveY(delta){
        this.camera.moveY(delta)
        this.draw()
    }


    selectStartObject(_x,_y){
        let selectedobj = {
            exist : false,
            dist : 9999,
            obj : null,
            x : _x,
            y : _y
        }
        for(let obj of this.drawObjects){
            let dist = obj.check(_x,_y)
            if(dist < this.selectDistLampda){
                if(selectedobj.dist > dist){
                    selectedobj.obj = obj
                    selectedobj.x = obj.x
                    selectedobj.y = obj.y
                    selectedobj.dist = dist
                }
            }
        }
        return selectedobj;
    }
    selectObject(x,y){
        
        this.hoverObj = null
        let selectedobj = {
            dist : 9999,
            obj : null
        }
        for(let obj of this.drawObjects){
            let dist = obj.check(x,y)
            if(dist < this.selectDistLampda){
                if(selectedobj.dist > dist){
                    selectedobj.obj = obj
                    selectedobj.exist = true
                    selectedobj.dist = dist
                }
            }
            obj.changeColor("red")
        }
        if(selectedobj.dist < this.selectDistLampda){
            selectedobj.obj.changeColor("blue")
            console.log("selected one")
            this.hoverObj = selectedobj.obj
        }
        this.draw()
    }

    drawLine(startObject,endObject){
        
        let selectedobj = {
            exist : false,
            dist : 9999,
            obj : null,
            x : 9999,
            y : 9999
        }
        this.clearTempObjects()
        if(!startObject.exist){
            startObject.obj = new Point(this.context,this.camera,new Vec4(startObject.x,startObject.y,0,1))
            this.drawObjects.push(startObject.obj)
        }
        if(!endObject.exist){
            endObject.obj = new Point(this.context,this.camera,new Vec4(endObject.x,endObject.y,0,1))
            this.drawObjects.push(endObject.obj)

        }
        this.drawObjects.push(new DrawLine(this.context,this.camera,startObject.obj,endObject.obj))
        this.draw()
    }

    drawTempLine(startObject,endObject){
        this.clearTempObjects()
        if(!startObject.exist){
            startObject.obj = new Point(this.context,this.camera,new Vec4(startObject.x,startObject.y,0,1))
            this.drawTempObjects.push(startObject.obj)
        }
        if(!endObject.exist){
            endObject.obj = new Point(this.context,this.camera,new Vec4(endObject.x,endObject.y,0,1))
            this.drawTempObjects.push(endObject.obj)

        }
        this.drawTempObjects.push(new DrawLine(this.context,this.camera,startObject.obj,endObject.obj))
        this.draw()        
    }

    clearTempObjects(){
        this.drawTempObjects = []
    }
    clearAll(){
        this.drawObjects = []
        this.clearTempObjects()
        this.draw()

    }


    draw(){
        this.hoverObj = null
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        console.log("draw")
        for(let obj of this.drawObjects){
            obj.draw()
        }
        for(let obj of this.drawTempObjects){
            obj.draw()
        }

        // Define a new path X
        let xStart = new Vec4(50,50,0,1)
        let xEnd = new Vec4(100,50,0,1)
        let camxStart = xStart.mulMatrix(this.camera.getCalcMatrix())
        let camxEnd = xEnd.mulMatrix(this.camera.getCalcMatrix())

        this.context.beginPath();
        this.context.moveTo(camxStart.x,camxStart.y);
                   this.context.lineTo(camxEnd.x, camxEnd.y);
                   this.context.strokeStyle = "black"
                   this.context.stroke();    

                    // y
                   this.context.beginPath();
                   this.context.moveTo(50,50);
                   this.context.lineTo(50, 100);
                   this.context.strokeStyle = "black"
                   this.context.stroke();    
    }
}