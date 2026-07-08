const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '..', 'img');

// Mapping of original names to safe names
const map = {
  'medica 1.jpg': 'medica_1.jpg',
  'medica 2.jpg': 'medica_2.jpg',
  'medica 8.png': 'medica_8.png',
  'medico 4.jpg': 'medico_4.jpg',
  'medico 5.webp': 'medico_5.webp',
  'medico 9.jpg': 'medico_9.jpg',
  'medico 10.jpg': 'medico_10.jpg',
  'médica 7.jpg': 'medica_7.jpg'
};

fs.readdirSync(imgDir).forEach(file => {
  const safeName = map[file];
  if (safeName) {
    const oldPath = path.join(imgDir, file);
    const newPath = path.join(imgDir, safeName);
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${file} → ${safeName}`);
  }
});

console.log('Renaming complete');
