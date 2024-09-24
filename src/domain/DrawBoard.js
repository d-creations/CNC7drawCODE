





export class DrawLine{

    ctx
    xS
    yS
    xE
    yE

    constructor(ctx,xS,yS,xE,yE){
        this.ctx = ctx
        this.xS = xS 
        this.yS = yS
        this.xE = xE 
        this.yE = yE

    }
    draw(){
           // Define a new path
           this.ctx.beginPath();
           // Set a start-point
           this.ctx.moveTo(this.xS, this.yS);
           // Set an end-point
           this.ctx.lineTo(this.xE, this.yE);
           // Stroke it (Do the Drawing)
           this.ctx.stroke();    
        }
        check(x,y){
        let xS_ = this.xS -x
        let yS_ = this.yS - y
        let xE_ = this.xE -x
        let yE_ = this.yE - y
        let xV_ = this.xE -this.xS
        let yV_ = this.yE -this.yS
        let x2 = x - this.xS 
        let y2 = y - this.yS 
        
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
    x
    y
    constructor(ctx,x,y){
        this.ctx = ctx
        this.x = x 
        this.y = y
    }
    draw(){
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = "red";
        this.ctx.fill();
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = "blue";
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
    constructor(canvas){
        this.context = canvas.getContext("2d")
        this.canvas = canvas
        this.drawObjects = []
    }

    drawPoint(x,y){
        this.drawObjects.push(new Point(this.context,x,y))
        this.draw()

    }
    selectObject(x,y){
        for(let obj of this.drawObjects){
            let dist = obj.check(x,y)
            console.log(dist)
        }
    }

    drawLine(xS,yS,xE,yE){
        this.drawObjects.push(new DrawLine(this.context,xS,yS,xE,yE))
        this.draw()
    }

    clearAll(){
        this.drawObjects = []
        this.draw()

    }


    draw(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        console.log("draw")
        for(let obj of this.drawObjects){
            obj.draw()
        }
    }
}