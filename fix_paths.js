import fs from 'fs';
import path from 'path';

function processFile(filePath) {
    if (!filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    const regex = /(from|import)\s+['"]([^'"]+)['"]/g;

    function replacer(match, keyword, importPath) {
        if (!importPath.startsWith('.')) return match;
        
        let dir = path.dirname(filePath);
        let resolvedPath = path.resolve(dir, importPath);

        // If it still resolves to the current folder but the file doesn't exist, we probably need to add '../'
        if (!fs.existsSync(resolvedPath)) {
            let alternativePath = path.resolve(dir, '..', importPath.replace(/^\.\//, ''));
            if (fs.existsSync(alternativePath)) {
                let newRel = path.relative(dir, alternativePath).replace(/\\/g, '/');
                if (!newRel.startsWith('.')) newRel = './' + newRel;
                return `${keyword} '${newRel}'`;
            }
        }
        
        return match;
    }

    content = content.replace(regex, replacer);

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed path in', filePath);
    }
}

function traverseDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const p = path.join(dir, item);
        if (fs.statSync(p).isDirectory()) {
            if (!p.includes('node_modules')) traverseDir(p);
        } else {
            processFile(p);
        }
    }
}

traverseDir('./src/domain/core');
traverseDir('./src/domain/viewController');

console.log('Path fix complete.');