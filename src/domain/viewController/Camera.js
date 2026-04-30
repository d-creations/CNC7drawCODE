


import { AppConfig } from '../core/Config.js'

export class Vec4{

    constructor(x,y,z,d){
        this.x = x
        this.y = y
        this.z = z
        this.d = d
    }

    mulMatrix(Matrix3D){
        let x = this.x * Matrix3D[0][0] + this.y * Matrix3D[0][1] + this.z * Matrix3D[0][2] + this.d * Matrix3D[0][3]  
        let y = this.x * Matrix3D[1][0] + this.y * Matrix3D[1][1] + this.z * Matrix3D[1][2]  + this.d * Matrix3D[1][3]
        let z = this.x * Matrix3D[2][0] + this.y * Matrix3D[2][1] + this.z * Matrix3D[2][2]  + this.d * Matrix3D[2][3]
        let d = this.x * Matrix3D[3][0] + this.y * Matrix3D[3][1] + this.z * Matrix3D[3][2]  + this.d * Matrix3D[3][3]
        return new Vec4(x,y,z,d)
    }
}

export class Camera{

//    translation

    calcMatrix
    constructor(){
        this.calcMatrix = this.getEinheitsMatrix()
    }

    getEinheitsMatrix(){
        // Using config to initialize scale mapping (pixels per unit)
        // Default is 1 if unset. e.g. Scale 10 = 10 pixels per 1 CNC unit.
        let scale = AppConfig.drawBoard.PixelsPerUnit || 1;
        return [
            [scale, 0, 0, 0],
            [0, scale, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]
    }

    getCalcMatrix(){
        return this.calcMatrix
    }

    getCamera3Vec(vec4){
        return vec4.mulMatrix(this.calcMatrix)
    }

    /**
     * Converts raw screen/canvas coordinates to World space vectors 
     * by applying the inverse camera translation and scale.
     */
    getWorldVec(screenX, screenY){
        // Scale Factor
        let scale = this.calcMatrix[0][0]; 
        
        let worldX = (screenX - this.calcMatrix[0][3]) / scale;
        let worldY = (screenY - this.calcMatrix[1][3]) / scale;

        // Apply grid snap / minimum step resolution from config
        let step = AppConfig.drawBoard.minStep;
        worldX = Math.round(worldX / step) * step;
        worldY = Math.round(worldY / step) * step;

        return new Vec4(worldX, worldY, 0, 1);
    }

    moveX(delta){
        this.calcMatrix[0][3] += delta

    }

    moveY(delta){
        this.calcMatrix[1][3] += delta
    }

    zoom(factor, cx, cy){
        let scaleBefore = this.calcMatrix[0][0];
        let worldX = (cx - this.calcMatrix[0][3]) / scaleBefore;
        let worldY = (cy - this.calcMatrix[1][3]) / scaleBefore;

        this.calcMatrix[0][0] *= factor;
        this.calcMatrix[1][1] *= factor;
        this.calcMatrix[2][2] *= factor;

        let scaleAfter = this.calcMatrix[0][0];
        this.calcMatrix[0][3] = cx - worldX * scaleAfter;
        this.calcMatrix[1][3] = cy - worldY * scaleAfter;
    }

}