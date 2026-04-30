export const AppConfig = {
    drawBoard: {
        // The display precision. 3 means 0.001 resolution.
        coordPrecision: 3,
        
        // Snap-to-grid or minimum coordinate step size. 
        // 0.001 means every coordinate will be rounded to the nearest 0.001 unit.
        minStep: 0.001,

        // Future-proofing: how many pixels represent 1 unit.
        // If 1 unit is 1mm, setting this to 10 or 100 allows you to visually zoom in.
        PixelsPerUnit: 1 
    }
};
