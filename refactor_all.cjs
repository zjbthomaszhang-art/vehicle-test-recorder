const fs = require('fs');
const path = require('path');

const directories = [
  'src/views',
  'src/components'
];

const replacements = [
  // Backgrounds
  [/bg-\[#0f1523\]/g, 'bg-slate-50 dark:bg-[#0f1523]'],
  [/bg-slate-950/g, 'bg-slate-50 dark:bg-slate-950'],
  [/bg-\[#111827\]/g, 'bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent'],
  [/bg-slate-900\/50/g, 'bg-white/80 dark:bg-slate-900/50 shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent'],
  [/bg-slate-900/g, 'bg-white dark:bg-slate-900 shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent'],
  [/bg-\[#1c1c1e\]/g, 'bg-slate-100 dark:bg-[#1c1c1e]'],
  [/bg-\[#2c2c2e\]/g, 'bg-slate-200 dark:bg-[#2c2c2e]'],
  
  // Texts
  [/text-slate-100/g, 'text-slate-800 dark:text-slate-100'],
  [/text-slate-200/g, 'text-slate-800 dark:text-slate-200'],
  [/text-slate-300/g, 'text-slate-700 dark:text-slate-300'],
  [/text-slate-400/g, 'text-slate-500 dark:text-slate-400'],
  [/text-white/g, 'text-slate-900 dark:text-white'],
  [/text-\[#94a3b8\]/g, 'text-slate-500 dark:text-[#94a3b8]'],
  
  // Borders
  [/border-\[#1e293b\]/g, 'border-slate-200 dark:border-[#1e293b]'],
  [/border-slate-800/g, 'border-slate-200 dark:border-slate-800'],
  [/border-slate-700/g, 'border-slate-300 dark:border-slate-700'],
  [/border-\[#3c3c43\]/g, 'border-slate-300 dark:border-[#3c3c43]'],
  [/border-\[#2c2c2e\]/g, 'border-slate-300 dark:border-[#2c2c2e]'],
  [/border-\[#2c2c2e\]\/50/g, 'border-slate-200 dark:border-[#2c2c2e]/50'],
  
  // Hovers
  [/hover:bg-\[#1e293b\]/g, 'hover:bg-slate-100 dark:hover:bg-[#1e293b]'],
  [/hover:bg-\[#2c2c2e\]/g, 'hover:bg-slate-200 dark:hover:bg-[#2c2c2e]'],
  [/hover:bg-slate-800/g, 'hover:bg-slate-100 dark:hover:bg-slate-800'],

  // Placeholders
  [/placeholder:text-slate-500/g, 'placeholder:text-slate-400 dark:placeholder:text-slate-500'],
  [/placeholder:text-slate-600/g, 'placeholder:text-slate-400 dark:placeholder:text-slate-600']
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      // Skip HomeView as it's already done mostly, but we can do a pass to catch remaining
      // Wait, we don't want double replacements. E.g. bg-white dark:bg-white dark:bg-[#111827].
      // Let's ensure we don't double replace.
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Safety check: if file already has dark: variants, maybe skip it or be careful.
      // We will just do raw string replace, but skip if already replaced in HomeView.
      if (fullPath.includes('HomeView.jsx')) return;

      let newContent = content;
      replacements.forEach(([regex, replacement]) => {
        newContent = newContent.replace(regex, replacement);
      });

      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Refactored ${fullPath}`);
      }
    }
  });
}

directories.forEach(processDirectory);
