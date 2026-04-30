import { View3D } from '../viewController/View3d.js';
import { DrawBoard } from './DrawBoard.js';
import { Camera } from '../viewController/Camera.js';

console.log("TEST")

let windowMainView = document.getElementById("windowMainView")

// 1. Create the Document Headless State (Camera & DrawBoard)
let camera = new Camera();
// Currently DrawBoard expects a canvas container. For now, we create it here in the Core.
let container = document.createElement("canvas");
let drawBoard = new DrawBoard(container, camera);

// 2. Inject it into the View / GUI
let view3D = new View3D(windowMainView, drawBoard, container, camera);

export function run(){
    console.log("TEST")
}
