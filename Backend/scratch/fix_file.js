const fs = require('fs');

const targetFile = '../Frontend/js/hospitais.js';
const restorePart = fs.readFileSync('../Frontend/js/restore_part.js', 'utf8');
const originalContent = fs.readFileSync(targetFile, 'utf8');

const lines = originalContent.split('\n');

// Lines 0 to 287 (inclusive) -> lines.slice(0, 288)
const firstPart = lines.slice(0, 288).join('\n');

// Lines 288 to end -> lines.slice(288)
const lastPart = lines.slice(288).join('\n');

const fixedContent = firstPart + '\n' + restorePart + '\n' + lastPart;

fs.writeFileSync(targetFile, fixedContent);
console.log('File fixed successfully!');
