const fs = require('fs');
const file = 'src/views/DefectsView.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/className="bg-transparent border-none outline-none text-\[12px\] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-\[#94a3b8\] w-full"/g, 
'className="bg-transparent border-none outline-none text-[12px] font-[700] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-normal w-full"');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed DefectsView search input styles.');
