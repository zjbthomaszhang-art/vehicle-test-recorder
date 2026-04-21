const fs = require('fs');

let c = fs.readFileSync('src/views/AdminView.jsx', 'utf8');

const targetStr = '<div key={c.id} className="bg-[#121826] border border-[#1e293b] rounded-[20px] p-[16px] flex justify-between items-center transition-transform active:scale-[0.98]">'
const newStr = '<div key={c.id} className="bg-[#121826] border border-[#1e293b] rounded-[14px] p-[10px] px-[14px] flex justify-between items-center transition-transform active:scale-[0.98]">'
c = c.replace(targetStr, newStr);

c = c.replace('<div className="flex flex-col gap-[8px] flex-1 min-w-0 pr-4">', '<div className="flex flex-col gap-[4px] flex-1 min-w-0 pr-4">');

c = c.replace('<div className="bg-[#3b82f6]/20 px-[6px] py-[2px] rounded border border-[#3b82f6]/30">', '<div className="bg-[#3b82f6]/20 px-[6px] h-[16px] flex items-center justify-center rounded border border-[#3b82f6]/30">');

c = c.replace('<span className="text-[8px] font-[800] text-[#60a5fa] leading-none translate-y-[0.5px]">ID {c.id}</span>', '<span className="text-[10px] font-[800] text-[#60a5fa] leading-none translate-y-[-0.5px]">#{c.id}</span>');
c = c.replace('<span className="text-[8px] font-[800] text-[#60a5fa]">ID {c.id}</span>', '<span className="text-[10px] font-[800] text-[#60a5fa] leading-none translate-y-[-0.5px]">#{c.id}</span>');

c = c.replace('<span className="text-[10px] font-[800] bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent truncate leading-none mt-[1.5px]">', '<span className="text-[10px] font-[800] bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent truncate leading-[16px] mt-[0.5px]">');

c = c.replace('<div className="flex items-center gap-[6px] mt-[2px] overflow-hidden flex-wrap sm:flex-nowrap">', '<div className="flex items-center gap-[6px] mt-0 overflow-hidden flex-wrap sm:flex-nowrap">');

c = c.replace('<span className="text-[14px] font-[900] text-white shrink-0">{c.function}</span>', '<span className="text-[13px] font-[900] text-white shrink-0">{c.function}</span>');

fs.writeFileSync('src/views/AdminView.jsx', c);
