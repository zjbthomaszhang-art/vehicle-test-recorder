const fs = require('fs');
const path = require('path');
const viewsDir = path.join(__dirname, 'src', 'views');

function replaceColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/bg-slate-950/g, 'bg-[#0f1523]');
  content = content.replace(/bg-slate-900/g, 'bg-[#111827]');
  content = content.replace(/bg-slate-800/g, 'bg-[#1e293b]');
  content = content.replace(/border-slate-800/g, 'border-[#1e293b]');
  content = content.replace(/border-slate-700/g, 'border-[#334155]');
  fs.writeFileSync(filePath, content);
}

fs.readdirSync(viewsDir).forEach(file => {
  if (file.endsWith('.jsx')) {
    replaceColors(path.join(viewsDir, file));
  }
});
console.log('Colors replaced successfully!');
