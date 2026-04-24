/**
 * Abstract Base Class defining the required interface (Type) for any CNC DrawBoard Shape.
 * Every custom graphical object (Line, Point, Arc, Spline) MUST inherit from this
 * to guarantee it integrates perfectly with the DrawBoard, Select Tool, and Property Editor.
 */
export class BaseShape {
    /**
     * @param {CanvasRenderingContext2D} ctx The HTML5 Canvas Drawing Context
     * @param {Camera} camera The global Camera handling world translations
     */
    constructor(ctx, camera) {
        if (this.constructor === BaseShape) {
            throw new Error("BaseShape is an abstract class and cannot be instantiated directly.");
        }
        this.ctx = ctx;
        this.camera = camera;
        this.color = "red"; // Default normal state color
        this.defaultColor = "red";
    }

    /** 
     * Renders the shape visually to the Canvas using the Camera's Matrix offset.
     * MUST use `.mulMatrix(this.camera.getCalcMatrix())` to draw correctly in the view window.
     * @abstract
     */
    draw() {
        throw new Error("Method 'draw()' must be implemented by subclasses.");
    }

    /** 
     * Hit-box selection logic.
     * Calculates the mathematical distance from the screen X/Y coordinate to this shape.
     * @param {number} x The canvas offsetX (mouse coordinate)
     * @param {number} y The canvas offsetY (mouse coordinate)
     * @returns {number} The absolute closest distance in calculated pixels. Returns < 9999 if found.
     * @abstract
     */
    check(x, y) {
        throw new Error("Method 'check(x, y)' must be implemented by subclasses.");
    }

    /**
     * Hit-box area selection logic.
     * Calculates if the shape is inside the given screen area.
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     * @param {boolean} requireComplete Whether the shape must be fully inside the area
     * @returns {boolean} True if inside the area.
     * @abstract
     */
    checkInsideArea(minX, minY, maxX, maxY, requireComplete) {
        // By default, shapes (like Measurements) are NOT selected by the drag box unless they override this.
        return false;
    }

    /** 
     * Self-documents to the Property Editor UI what editable variables it has.
     * @param {PropertyEditor} editor The UI Property Editor instance providing input generators.
     * @abstract
     */
    buildProperties(editor) {
        throw new Error("Method 'buildProperties(editor)' must be implemented by subclasses.");
    }

    /**
     * Returns virtual or sub-geometry shapes managed by this parent shape.
     * Overridden by complex shapes (e.g. circles with live tangent points).
     * @returns {BaseShape[]} Array of sub-shapes.
     */
    getSubObjects() {
        return [];
    }

    /** Standard inherited method allowing the Selection tool to flag objects Green */
    changeColor(color, isPermanent = false) {
        this.color = color;
        if (isPermanent || color === "red" || color === "purple" || color.match(/^#/)) {
            // Note: This heuristic assumes "#..." hex might be from property editor but
            // usually it is better to explicit set defaultColor manually in PropertyEditor.
        }
    }

    /** Helper method down to resolve canvas snapping points or create raw ones */
    static resolvePoint(drawBoard, ptParam, isTemp = false) {
        if (ptParam.exist) return ptParam.obj;
        
        let vec = drawBoard.camera.getWorldVec(ptParam.x, ptParam.y);
        // Using "Point" requires importing it in subclasses since BaseShape sits at top. 
        // Subclasses will handle the actual Point instantiation if needed.
        return null; 
    }
}