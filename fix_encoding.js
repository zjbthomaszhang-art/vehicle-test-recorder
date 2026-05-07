const fs = require('fs');
const file = 'src/views/DefectsView.jsx';
let content = fs.readFileSync(file, 'utf8'); // It might read the replacement chars as 

// We just replace the STAGES block entirely.
const newStages = `const STAGES = [
  { id: 'Plan', label: '新提交', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/50' },
  { id: 'Do', label: '处理中', color: 'text-[#eab308]', bg: 'bg-[#eab308]/10', border: 'border-[#eab308]/50' },
  { id: 'Check', label: '验证中', color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10', border: 'border-[#3b82f6]/50' },
  { id: 'Act', label: '已解决', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10', border: 'border-[#10b981]/50' }
];`;

content = content.replace(/const STAGES = \[[\s\S]*?\];/, newStages);

// Also need to fix line 351 PC Table headers which might have been corrupted? Let's check if any other Chinese text was corrupted.
// Wait, my PowerShell scripts ONLY targeted specific lines or the whole file using UTF8 for the last one, but the earlier ones used default encoding which corrupted EVERYTHING non-ASCII.
// Oh no, if the whole file was read and written with Windows-1252, ALL Chinese characters in DefectsView.jsx are corrupted!
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed STAGES array.');
