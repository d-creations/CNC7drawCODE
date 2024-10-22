


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
        return [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
    }

    getCalcMatrix(){
        return this.calcMatrix
    }

    getCamera3Vec(vec4){
        return vec4.mulMatrix(this.calcMatrix)
    }

    moveX(delta){
        this.calcMatrix[0][3] += delta

    }

    moveY(delta){
        this.calcMatrix[1][3] += delta
    }

}