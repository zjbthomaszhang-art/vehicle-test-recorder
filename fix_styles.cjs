const fs = require('fs');
let c = fs.readFileSync('src/views/HomeView.jsx', 'utf8');

c = c.replace(/className=\"animate-cyber-letter\"/g, 'className=\"animate-cyber-letter text-slate-900 dark:text-white\"');
c = c.replace(/from-\\[#38bdf8\\] to-\\[#818cf8\\]/g, 'from-blue-500 to-blue-400 dark:from-[#38bdf8] dark:to-[#818cf8]');

fs.writeFileSync('src/views/HomeView.jsx', c);
