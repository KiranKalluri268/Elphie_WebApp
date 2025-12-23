const fs = require('fs');
const path = require('path');

const svgPath = 'd:\\Kiran\\Elphie_WebApp\\frontend\\public\\dental_chart-01.svg';

try {
    let content = fs.readFileSync(svgPath, 'utf8');

    // Regex to find paths
    // Look for <path ... d="..." ... id="..." ... />
    // We want to extract id and d.
    // The attributes might be in any order.
    // robust regex for collecting attributes match:
    // <path[^>]*d="([^"]+)"[^>]*id="([^"]+)"
    // BUT regex is brittle if attributes order varies.
    // Better to match the whole <path ... /> string and then extract attributes from it.

    const pathRegex = /<path[^>]*>/g;
    let match;
    const items = [];

    // Matrix transform values
    // transform="matrix(0.1,0,0,-0.1,13.464695,237.4629)"
    const matrix = [0.1, 0, 0, -0.1, 13.464695, 237.4629];
    const [a, b, c, d_matrix, e, f] = matrix;

    while ((match = pathRegex.exec(content)) !== null) {
        const pathTag = match[0];

        const idMatch = /id="([^"]+)"/.exec(pathTag);
        const dMatch = /d="([^"]+)"/.exec(pathTag);

        if (idMatch && dMatch) {
            const id = idMatch[1];
            const d = dMatch[1];

            // Extract first point (M x y or m x y)
            // Regex to find first two numbers
            const coordMatch = /[Mm]\s*(-?[\d.]+)[,\s](-?[\d.]+)/.exec(d);

            if (coordMatch) {
                const rawX = parseFloat(coordMatch[1]);
                const rawY = parseFloat(coordMatch[2]);

                // Transform
                // x' = ax + cy + e
                // y' = bx + dy + f
                const screenX = a * rawX + c * rawY + e;
                const screenY = b * rawX + d_matrix * rawY + f;

                items.push({
                    originalId: id,
                    screenX,
                    screenY,
                    rawTag: pathTag
                });
            }
        }
    }

    console.log(`Found ${items.length} paths.`);

    if (items.length !== 32) {
        console.warn('Warning: Expected 32 paths.');
    }

    // Sort by Y to find rows (Small Y = Top)
    items.sort((a, b) => a.screenY - b.screenY);

    // Split items into top and bottom
    // Assuming even split of 16 and 16 if 32 total
    let topRow = [];
    let bottomRow = [];
    if (items.length === 32) {
        topRow = items.slice(0, 16);
        bottomRow = items.slice(16, 32);
    } else {
        const avgY = items.reduce((sum, item) => sum + item.screenY, 0) / items.length;
        topRow = items.filter(item => item.screenY < avgY);
        bottomRow = items.filter(item => item.screenY >= avgY);
    }

    const mapping = {};

    // Top Row: Sort X Ascending (Left to Right) -> 1 to 16
    topRow.sort((a, b) => a.screenX - b.screenX);
    topRow.forEach((item, index) => {
        const newId = `tooth-${index + 1}`;
        mapping[item.originalId] = newId;
        console.log(`${item.originalId} -> ${newId} (X: ${item.screenX.toFixed(1)}, Y: ${item.screenY.toFixed(1)})`);
    });

    // Bottom Row: Sort X Ascending (Left to Right) -> 32 down to 17
    bottomRow.sort((a, b) => a.screenX - b.screenX);
    bottomRow.forEach((item, index) => {
        const newId = `tooth-${32 - index}`;
        mapping[item.originalId] = newId;
        console.log(`${item.originalId} -> ${newId} (X: ${item.screenX.toFixed(1)}, Y: ${item.screenY.toFixed(1)})`);
    });

    // Apply Replacements
    // We replace id="oldID" with id="newID"
    let newContent = content;
    for (const [oldId, newId] of Object.entries(mapping)) {
        // Use a precise regex to ensure we don't match substrings incorrectly
        // The file has id="path1", id="path2"...
        // Replacement: id="path1" -> id="tooth-1"
        const regex = new RegExp(`id="${oldId}"`, 'g');
        newContent = newContent.replace(regex, `id="${newId}"`);
    }

    fs.writeFileSync(svgPath, newContent, 'utf8');
    console.log('Saved modified SVG.');

} catch (err) {
    console.error(err);
}
