const fs = require('fs');
const path = require('path');

const directories = [
  'src/views',
  'src/components'
];

const replacements = [
  // Dashboard PC Root
  [/bg-\[\#0a0f1e\]/g, 'bg-slate-50 dark:bg-[#0a0f1e]'],
  
  // Dashboard PC Session Card
  [/bg-\[\#121826\]/g, 'bg-white dark:bg-[#121826] shadow-sm dark:shadow-none'],

  // AdminView & others Cards & Inputs
  // AdminView uses `bg-[#1e293b] border border-[#334155]` for cards.
  // We should safely replace `bg-[#1e293b]` keeping in mind some places use it without borders.
  // If it's a card/input:
  [/bg-\[\#1e293b\]/g, 'bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none'],

  // Opacity variants
  [/bg-\[\#1e293b\]\/50/g, 'bg-slate-50 dark:bg-[#1e293b]/50'],
  [/bg-\[\#1e293b\]\/30/g, 'bg-slate-50 dark:bg-[#1e293b]/30'],
  [/bg-\[\#1e293b\]\/20/g, 'bg-slate-50 dark:bg-[#1e293b]/20'],
  [/bg-\[\#1e293b\]\/60/g, 'bg-slate-200 dark:bg-[#1e293b]/60'],

  // Borders
  [/border-\[\#334155\]/g, 'border-slate-200 dark:border-[#334155]'],
  [/border-\[\#334155\]\/60/g, 'border-slate-200 dark:border-[#334155]/60'],
  
  // Hovers
  [/hover:bg-\[\#334155\]/g, 'hover:bg-slate-100 dark:hover:bg-[#334155]'],

  // Texts
  [/text-\[\#cbd5e1\]/g, 'text-slate-700 dark:text-[#cbd5e1]'],
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      // Avoid double replacement if something like "dark:bg-[#1e293b]" already exists
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      
      // Temporary hide `dark:` variants to avoid matching them
      newContent = newContent.replace(/dark:bg-\[\#1e293b\]/g, '__DARK_BG_1E293B__');
      newContent = newContent.replace(/dark:bg-\[\#121826\]/g, '__DARK_BG_121826__');
      newContent = newContent.replace(/dark:border-\[\#334155\]/g, '__DARK_BORDER_334155__');

      replacements.forEach(([regex, replacement]) => {
        newContent = newContent.replace(regex, replacement);
      });

      // Restore
      newContent = newContent.replace(/__DARK_BG_1E293B__/g, 'dark:bg-[#1e293b]');
      newContent = newContent.replace(/__DARK_BG_121826__/g, 'dark:bg-[#121826]');
      newContent = newContent.replace(/__DARK_BORDER_334155__/g, 'dark:border-[#334155]');

      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Refactored ${fullPath}`);
      }
    }
  });
}

directories.forEach(processDirectory);
