const fs = require('fs');

function fixHomeView2() {
  const file = 'src/views/HomeView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Fix Group 1 Icon Sizes (Calendar and Code are currently 26)
  content = content.replace(/<Calendar size=\{26\}/g, '<Calendar size={22}');
  content = content.replace(/<Code size=\{26\}/g, '<Code size={22}');

  // Fix Group 3 flex ratio, padding, and gap
  // Group 3 is 测试环境 & 测试人员
  // Just do string replaces for Group 3 exactly as it appears
  content = content.replace(
    /className="flex-\[46\] bg-white dark:bg-\[#111827\] shadow-sm dark:shadow-none border border-slate-200\/60 dark:border-transparent rounded-\[16px\] h-\[40px\] px-\[16px\] flex items-center justify-between group focus-within:ring-1 focus-within:ring-\[#007AFF\] transition-all min-w-0">\s*<div className="flex items-center gap-\[8px\] sm:gap-\[14px\] shrink-0">/,
    `className="flex-[48] bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent rounded-[16px] h-[40px] px-[12px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">\n            <div className="flex items-center gap-[4px] sm:gap-[6px] shrink-0">`
  );

  content = content.replace(
    /className="flex-\[54\] bg-white dark:bg-\[#111827\] shadow-sm dark:shadow-none border border-slate-200\/60 dark:border-transparent rounded-\[16px\] h-\[40px\] px-\[16px\] flex items-center justify-between group focus-within:ring-1 focus-within:ring-\[#007AFF\] transition-all min-w-0">\s*<div className="flex items-center gap-\[8px\] sm:gap-\[14px\] shrink-0">/,
    `className="flex-[52] bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent rounded-[16px] h-[40px] px-[12px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">\n            <div className="flex items-center gap-[4px] sm:gap-[6px] shrink-0">`
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed HomeView.jsx alignments and icons');
}

fixHomeView2();
