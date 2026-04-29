const fs = require('fs');
const path = require('path');

const shapesDir = path.join(__dirname, 'src', 'domain', 'shapes');
const files = fs.readdirSync(shapesDir).filter(f => f.endsWith('.js'));

for (let file of files) {
    let content = fs.readFileSync(path.join(shapesDir, file), 'utf8');

    // Super simple line-by-line processor
    let lines = content.split('\n');
    let outLines = [];
    let insideMethod = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (!insideMethod) {
            if (line.match(/^\s*check\([^)]*\)\s*\{/) || line.match(/^\s*checkInsideArea\([^)]*\)\s*\{/)) {
                insideMethod = true;
                braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
                if (braceCount === 0) insideMethod = false; // single line method
            } else {
                outLines.push(line);
            }
        } else {
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            if (braceCount <= 0) {
                insideMethod = false;
            }
        }
    }

    fs.writeFileSync(path.join(shapesDir, file), outLines.join('\n'), 'utf8');
}
console.log("Check methods removed from shapes.");
