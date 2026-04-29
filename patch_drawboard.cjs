const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'domain', 'DrawBoard.js');
let code = fs.readFileSync(filePath, 'utf8');

// Add import
if (!code.includes('import { HitTester }')) {
    code = code.replace(
        'import { Camera } from "./Camera.js";',
        'import { Camera } from "./Camera.js";\nimport { HitTester } from "./renderers/HitTester.js";'
    );
}

// Replace check calls
code = code.replace(/let dist = obj\.check\(_x,_y\)/g, 'let dist = HitTester.hitTest(obj.getRenderData(), _x, _y, this.camera)');
code = code.replace(/let dist = obj\.check\(x,y\)/g, 'let dist = HitTester.hitTest(obj.getRenderData(), x, y, this.camera)');
code = code.replace(/if \(obj\.checkInsideArea && obj\.checkInsideArea\(minX, minY, maxX, maxY, requireComplete\)\)/g, 'if (HitTester.checkInsideArea(obj.getRenderData(), minX, minY, maxX, maxY, requireComplete, this.camera))');

fs.writeFileSync(filePath, code, 'utf8');
console.log("Patched DrawBoard.js!");
