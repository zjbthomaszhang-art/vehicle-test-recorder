const fs = require('fs');
const path = require('path');

const directories = [
  'src/views',
  'src/components'
];

const replacements = [
  // Fix bg broken variants
  [/bg-white dark:bg-\[\#1e293b\] shadow-sm dark:shadow-none\/50/g, 'bg-slate-50 dark:bg-[#1e293b]/50'],
  [/bg-white dark:bg-\[\#1e293b\] shadow-sm dark:shadow-none\/30/g, 'bg-slate-50 dark:bg-[#1e293b]/30'],
  [/bg-white dark:bg-\[\#1e293b\] shadow-sm dark:shadow-none\/20/g, 'bg-slate-50 dark:bg-[#1e293b]/20'],
  [/bg-white dark:bg-\[\#1e293b\] shadow-sm dark:shadow-none\/60/g, 'bg-slate-200 dark:bg-[#1e293b]/60'],

  // Fix hover broken variant
  [/dark:hover:bg-white dark:bg-\[\#1e293b\] shadow-sm dark:shadow-none\/50/g, 'dark:hover:bg-[#1e293b]/50'],
  
  // Actually, wait, it was `hover:bg-slate-100 dark:hover:bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none/50`.
  // Wait, let's just use replace on exactly `dark:hover:bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none/50` -> `dark:hover:bg-[#1e293b]/50`
  
  // Fix border broken variants
  [/border-slate-200 dark:border-slate-200 dark:border-\[\#334155\]\/60/g, 'border-slate-200 dark:border-[#334155]/60'],
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
        console.log(`Repaired ${fullPath}`);
      }
    }
  });
}

directories.forEach(processDirectory);
