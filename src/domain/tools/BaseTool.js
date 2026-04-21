export class BaseTool {
    constructor(drawBoard) {
        this.drawBoard = drawBoard;
        this.step = 0; // State tracker for multi-click tools
    }

    onMouseDown(position) {}
    onMouseMove(position) {}
    onMouseClick(position) {}
    onMouseUp(position) {}

    reset() {
        this.step = 0;
        this.drawBoard.clearTempObjects();
        this.drawBoard.draw();
    }
}
