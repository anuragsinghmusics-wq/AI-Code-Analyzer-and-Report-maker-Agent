const fs = require('fs');
const path = require('path');

const dir = 'src/nodes';
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    // We want to replace \` with ` and \$ with $
    content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
    fs.writeFileSync(filePath, content);
  }
});
console.log('Fixed escape sequences');
