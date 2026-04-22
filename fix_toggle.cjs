const fs = require('fs');
let c = fs.readFileSync('src/views/HomeView.jsx', 'utf8');

const regex = /<div className="w-12 h-12 bg-blue-600\/10 rounded-2xl flex items-center justify-center border border-blue-500\/20">[\s\S]*?<Car className="text-blue-500" size=\{28\} \/>[\s\S]*?<\/div>/m;

const newIconBlock = `<button onClick={toggleTheme} className="w-12 h-12 bg-white dark:bg-[#111827] rounded-2xl flex items-center justify-center border border-slate-200 dark:border-[#1e293b] shadow-sm dark:shadow-none transition-colors active:scale-95">
          {theme === 'dark' ? <Sun className="text-amber-500" size={26} strokeWidth={1.5} /> : <Moon className="text-slate-600" size={26} strokeWidth={1.5} />}
        </button>`;

if (regex.test(c)) {
  c = c.replace(regex, newIconBlock);
  fs.writeFileSync('src/views/HomeView.jsx', c);
  console.log('Successfully replaced');
} else {
  console.log('Regex did not match');
}
