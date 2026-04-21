const fs = require('fs');

let c = fs.readFileSync('src/views/AdminView.jsx', 'utf8');

c = c.replace(
  '<div className="flex items-center gap-[6px]">',
  '<div className="flex items-center gap-[6px] h-[16px]">'
);

c = c.replace(
  '<div className="bg-[#3b82f6]/20 px-[5px] py-[1px] rounded border border-[#3b82f6]/30">',
  '<div className="bg-[#3b82f6]/20 px-[5px] flex items-center justify-center rounded border border-[#3b82f6]/30 h-[16px]">'
);

c = c.replace(
  '<span className="text-[8px] font-[800] text-[#60a5fa]">ID {c.id}</span>',
  '<span className="text-[8px] font-[800] text-[#60a5fa] leading-none translate-y-[0.5px]">ID {c.id}</span>'
);

c = c.replace(
  '<span className="text-[10px] font-[800] bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent truncate">',
  '<span className="text-[10px] font-[800] bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent truncate leading-none mt-[1.5px]">'
);

fs.writeFileSync('src/views/AdminView.jsx', c);
