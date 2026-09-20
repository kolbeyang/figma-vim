const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.join(__dirname, 'src/ui.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'dist/styles.css'), 'utf8');

const output = template.replace('/* __INJECT_CSS__ */', css);

fs.writeFileSync(path.join(__dirname, 'ui.html'), output);
console.log('Built ui.html');
