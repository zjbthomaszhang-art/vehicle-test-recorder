import re

def fix_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        if isinstance(old, re.Pattern):
            content = old.sub(new, content)
        else:
            content = content.replace(old, new)
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {filepath}")

# 1. CustomSelect.jsx: Change placeholder text to 12px
fix_file('src/components/CustomSelect.jsx', [
    ('text-slate-400 font-normal text-[14px]', 'text-slate-400 font-normal text-[12px]')
])

# 2. HistoryView.jsx: Date inputs dynamic font size
fix_file('src/views/HistoryView.jsx', [
    ('className="bg-slate-50 dark:bg-[#0f1523] appearance-none border border-slate-200 dark:border-[#1e293b] rounded-[10px] w-full min-w-0 h-[36px] px-[6px] text-[16px] text-slate-500 dark:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] outline-none"', 'className={`bg-slate-50 dark:bg-[#0f1523] appearance-none border border-slate-200 dark:border-[#1e293b] rounded-[10px] w-full min-w-0 h-[36px] px-[6px] text-slate-500 dark:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] outline-none ${filterStartDate ? \'text-[16px]\' : \'text-[12px]\'}`}'),
    ('className="bg-slate-50 dark:bg-[#0f1523] appearance-none border border-slate-200 dark:border-[#1e293b] rounded-[10px] w-full min-w-0 h-[36px] px-[6px] text-[16px] text-slate-500 dark:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] outline-none"', 'className={`bg-slate-50 dark:bg-[#0f1523] appearance-none border border-slate-200 dark:border-[#1e293b] rounded-[10px] w-full min-w-0 h-[36px] px-[6px] text-slate-500 dark:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] outline-none ${filterEndDate ? \'text-[16px]\' : \'text-[12px]\'}`}')
])

# 3. DefectsView.jsx: Search input placeholder
fix_file('src/views/DefectsView.jsx', [
    ('text-[12px] font-[700] text-slate-900 dark:text-white placeholder:text-slate-400', 'text-[16px] font-[700] text-slate-900 dark:text-white placeholder:text-[12px] placeholder:text-slate-400')
])

# 4. AdminView.jsx: Fix line 321 that was missed by regex
fix_file('src/views/AdminView.jsx', [
    ('text-[16px] text-slate-900 dark:text-white focus:outline-none"', 'text-[16px] placeholder:text-[12px] text-slate-900 dark:text-white focus:outline-none"')
])

