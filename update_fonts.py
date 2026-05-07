import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

# 1. HomeView.jsx
replace_in_file('src/views/HomeView.jsx', [
    ('font-[700] text-[13px] sm:text-[14px]', 'font-[700] text-[16px]'),
    ('font-[700] text-[14px]', 'font-[700] text-[16px]'),
    ('text-[14px] text-slate-900 dark:text-white font-[700]', 'text-[16px] text-slate-900 dark:text-white font-[700]')
])

# 2. EditSessionModal.jsx
replace_in_file('src/components/EditSessionModal.jsx', [
    ('text-[15px]', 'text-[16px]'),
    ('p-[12px] text-[14px] text-slate-900', 'p-[12px] text-[16px] text-slate-900')
])

# 3. HistoryView.jsx
replace_in_file('src/views/HistoryView.jsx', [
    ('px-[6px] text-[11px] text-slate-500', 'px-[6px] text-[16px] text-slate-500'),
    ('px-[12px] text-[12px] text-slate-500', 'px-[12px] text-[16px] text-slate-500'),
    ('textColor="text-slate-500 dark:text-[#94a3b8] text-[12px]"', 'textColor="text-slate-500 dark:text-[#94a3b8] text-[16px]"')
])

# 4. AdminView.jsx
replace_in_file('src/views/AdminView.jsx', [
    ('text-[12px] text-slate-900 dark:text-white focus:outline', 'text-[16px] text-slate-900 dark:text-white focus:outline')
])
