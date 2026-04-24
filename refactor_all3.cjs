const fs = require('fs');
const path = require('path');

const directories = [
  'src/views',
  'src/components'
];

const replacements = [
  // Text Colors
  [/text-\[\#f8fafc\]/g, 'text-slate-900 dark:text-[#f8fafc]'],
  [/text-\[\#334155\]/g, 'text-slate-500 dark:text-[#334155]'],
  [/text-\[\#475569\]/g, 'text-slate-500 dark:text-[#475569]'],
  
  // Specific fix for TestView active case text where text-[#f8fafc] is embedded in ternary
  // Actually, text-slate-900 dark:text-[#f8fafc] will just work safely in class strings.

  // Also Dashboard KPI cards missed `bg-slate-50 dark:bg-[#121826]` instead of `bg-white dark:bg-[#121826]`
  // Wait, in DashboardView, line 157 uses `bg-[#121826]` -> it got replaced to `bg-white dark:bg-[#121826]`.
  // Actually `bg-white dark:bg-[#121826]` is totally fine.
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
        console.log(`Refactored ${fullPath}`);
      }
    }
  });
}

directories.forEach(processDirectory);
