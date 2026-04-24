const fs = require('fs');
const path = require('path');

const directories = [
  'src/views',
  'src/components'
];

const replacements = [
  [/bg-\[\#0f172a\]/g, 'bg-slate-100 dark:bg-[#0f172a]'],
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      
      replacements.forEach(([regex, replacement]) => {
        newContent = newContent.replace(regex, replacement);
      });

      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Refactored bg-[#0f172a] in ${fullPath}`);
      }
    }
  });
}

directories.forEach(processDirectory);
