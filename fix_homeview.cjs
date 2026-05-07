const fs = require('fs');
const file = 'src/views/HomeView.jsx';
let content = fs.readFileSync(file, 'utf8');

// The fields to modify are 生产阶段, 总里程数, 测试环境, 测试人员
// We want to reduce their internal padding and gap, and icon size.

// Pattern to find these blocks
const fields = ['生产阶段', '总里程数', '测试环境', '测试人员'];

fields.forEach(field => {
  // We need to replace px-[16px] with px-[12px] on the parent div containing the field.
  // Actually, let's just do a string replace on the exact text blocks for safety.
});

// Since the blocks are very similar, let's replace them carefully.
// 生产阶段
content = content.replace(
  /<Layers size=\{26\} className="text-slate-900 dark:text-white p-\[2px\] shrink-0" strokeWidth=\{1\.5\} \/>\s*<span className="text-\[13px\] sm:text-\[14px\] font-\[600\] text-slate-500 dark:text-\[#94a3b8\] whitespace-nowrap">生产阶段<\/span>/,
  `<Layers size={22} className="text-slate-900 dark:text-white p-[2px] shrink-0" strokeWidth={1.5} />\n              <span className="text-[13px] sm:text-[14px] font-[600] text-slate-500 dark:text-[#94a3b8] whitespace-nowrap">生产阶段</span>`
);
content = content.replace(
  /className="flex-\[46\] bg-white dark:bg-\[#111827\] shadow-sm dark:shadow-none border border-slate-200\/60 dark:border-transparent rounded-\[16px\] h-\[54px\] px-\[16px\] flex items-center justify-between group focus-within:ring-1 focus-within:ring-\[#007AFF\] transition-all min-w-0">\s*<div className="flex items-center gap-\[8px\] sm:gap-\[14px\] shrink-0">/,
  `className="flex-[48] bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent rounded-[16px] h-[54px] px-[12px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">\n            <div className="flex items-center gap-[4px] sm:gap-[6px] shrink-0">`
);

// 测试环境
content = content.replace(
  /<Monitor size=\{26\} className="text-slate-900 dark:text-white p-\[2px\] shrink-0" strokeWidth=\{1\.5\} \/>\s*<span className="text-\[13px\] sm:text-\[14px\] font-\[600\] text-slate-500 dark:text-\[#94a3b8\] whitespace-nowrap">测试环境<\/span>/,
  `<Monitor size={22} className="text-slate-900 dark:text-white p-[2px] shrink-0" strokeWidth={1.5} />\n              <span className="text-[13px] sm:text-[14px] font-[600] text-slate-500 dark:text-[#94a3b8] whitespace-nowrap">测试环境</span>`
);
content = content.replace(
  /className="flex-\[46\] bg-white dark:bg-\[#111827\] shadow-sm dark:shadow-none border border-slate-200\/60 dark:border-transparent rounded-\[16px\] h-\[54px\] px-\[16px\] flex items-center justify-between group focus-within:ring-1 focus-within:ring-\[#007AFF\] transition-all min-w-0">\s*<div className="flex items-center gap-\[8px\] sm:gap-\[14px\] shrink-0">/,
  `className="flex-[48] bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent rounded-[16px] h-[54px] px-[12px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">\n            <div className="flex items-center gap-[4px] sm:gap-[6px] shrink-0">`
);

// 总里程数
content = content.replace(
  /<Gauge size=\{26\} className="text-slate-900 dark:text-white p-\[2px\] shrink-0" strokeWidth=\{1\.5\} \/>\s*<span className="text-\[13px\] sm:text-\[14px\] font-\[600\] text-slate-500 dark:text-\[#94a3b8\] whitespace-nowrap">总里程数<\/span>/,
  `<Gauge size={22} className="text-slate-900 dark:text-white p-[2px] shrink-0" strokeWidth={1.5} />\n              <span className="text-[13px] sm:text-[14px] font-[600] text-slate-500 dark:text-[#94a3b8] whitespace-nowrap">总里程数</span>`
);
content = content.replace(
  /className="flex-\[54\] bg-white dark:bg-\[#111827\] shadow-sm dark:shadow-none border border-slate-200\/60 dark:border-transparent rounded-\[16px\] h-\[54px\] px-\[16px\] flex items-center justify-between group focus-within:ring-1 focus-within:ring-\[#007AFF\] transition-all min-w-0">\s*<div className="flex items-center gap-\[8px\] sm:gap-\[14px\] shrink-0">/,
  `className="flex-[52] bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent rounded-[16px] h-[54px] px-[12px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">\n            <div className="flex items-center gap-[4px] sm:gap-[6px] shrink-0">`
);

// 测试人员
content = content.replace(
  /<User size=\{26\} className="text-slate-900 dark:text-white p-\[2px\] shrink-0" strokeWidth=\{1\.5\} \/>\s*<span className="text-\[13px\] sm:text-\[14px\] font-\[600\] text-slate-500 dark:text-\[#94a3b8\] whitespace-nowrap">测试人员<\/span>/,
  `<User size={22} className="text-slate-900 dark:text-white p-[2px] shrink-0" strokeWidth={1.5} />\n              <span className="text-[13px] sm:text-[14px] font-[600] text-slate-500 dark:text-[#94a3b8] whitespace-nowrap">测试人员</span>`
);
content = content.replace(
  /className="flex-\[54\] bg-white dark:bg-\[#111827\] shadow-sm dark:shadow-none border border-slate-200\/60 dark:border-transparent rounded-\[16px\] h-\[54px\] px-\[16px\] flex items-center justify-between group focus-within:ring-1 focus-within:ring-\[#007AFF\] transition-all min-w-0">\s*<div className="flex items-center gap-\[8px\] sm:gap-\[14px\] shrink-0">/,
  `className="flex-[52] bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent rounded-[16px] h-[54px] px-[12px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">\n            <div className="flex items-center gap-[4px] sm:gap-[6px] shrink-0">`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed spacing in HomeView.jsx');
