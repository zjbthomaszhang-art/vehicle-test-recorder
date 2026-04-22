const fs = require('fs');

function refactorFile(path) {
  let c = fs.readFileSync(path, 'utf8');

  if (path.includes('HomeView.jsx')) {
    c = c.replace(/import \{ Car,/g, 'import { Car, Sun, Moon,');
    if (!c.includes('useTheme')) {
      c = c.replace(/import CustomSelect from '\.\.\/components\/CustomSelect\.jsx';/g, "import CustomSelect from '../components/CustomSelect.jsx';\nimport { useTheme } from '../hooks/useTheme.js';");
      c = c.replace(/export default function HomeView\(\{(.*?)\}\) \{/s, (match) => match + "\n  const { theme, toggleTheme } = useTheme();");
    }

    c = c.replace(/className="min-h-screen bg-slate-950 text-slate-100/, 'className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100');
    c = c.replace(/className="text-\[10px\] text-slate-500/, 'className="text-[10px] text-slate-500 dark:text-slate-400');

    // Replace top right icon
    const oldIconBlock = `<div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">\n          <Car className="text-blue-500" size={28} />\n        </div>`;
    const newIconBlock = `<button onClick={toggleTheme} className="w-12 h-12 bg-white dark:bg-[#111827] rounded-2xl flex items-center justify-center border border-slate-200 dark:border-[#1e293b] shadow-sm dark:shadow-none transition-colors active:scale-95">\n          {theme === 'dark' ? <Sun className="text-amber-500" size={26} strokeWidth={1.5} /> : <Moon className="text-slate-600" size={26} strokeWidth={1.5} />}\n        </button>`;
    c = c.replace(oldIconBlock, newIconBlock);
  }

  // Generic replacements
  c = c.replace(/bg-\[#111827\]/g, 'bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent');
  c = c.replace(/text-white/g, 'text-slate-900 dark:text-white');
  c = c.replace(/text-\[#94a3b8\]/g, 'text-slate-500 dark:text-[#94a3b8]');
  c = c.replace(/placeholder:text-slate-600/g, 'placeholder:text-slate-400 dark:placeholder:text-slate-600');
  c = c.replace(/bg-\[#1c1c1e\]/g, 'bg-slate-100 dark:bg-[#1c1c1e]');
  c = c.replace(/border-\[#3c3c43\]/g, 'border-slate-300 dark:border-[#3c3c43]');
  c = c.replace(/hover:bg-\[#2c2c2e\]/g, 'hover:bg-slate-200 dark:hover:bg-[#2c2c2e]');
  c = c.replace(/border-\[#2c2c2e\]\/50/g, 'border-slate-200 dark:border-[#2c2c2e]/50');

  fs.writeFileSync(path, c);
}

const files = [
  'src/views/HomeView.jsx',
];

files.forEach(refactorFile);
