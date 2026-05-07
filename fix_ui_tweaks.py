import os
import glob

views_dir = 'src/views/'
files = glob.glob(os.path.join(views_dir, '*.jsx'))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. Fix Title Fonts Contrast (Replace Slate 600/400 with Slate 300 for titles)
    # The titles usually have: text-slate-500 dark:text-[#475569] or text-slate-500 dark:text-[#94a3b8]
    # Let's replace those specific combinations to be safe
    content = content.replace('text-slate-500 dark:text-[#475569]', 'text-slate-500 dark:text-[#cbd5e1]')
    content = content.replace('text-slate-500 dark:text-[#94a3b8]', 'text-slate-500 dark:text-[#cbd5e1]')
    
    # 2. Fix TestView case nav header background
    if 'TestView.jsx' in filepath:
        content = content.replace(
            'bg-slate-100 dark:bg-[#334155] flex justify-between items-center pt-[40px] px-[24px] pb-[16px] shrink-0',
            'bg-slate-100 dark:bg-[#1e293b] flex justify-between items-center pt-[40px] px-[24px] pb-[16px] shrink-0 border-b border-slate-200 dark:border-[#334155]'
        )
        
    # 3. Reduce HomeView input heights by 2px (54px -> 52px)
    if 'HomeView.jsx' in filepath:
        content = content.replace('h-[54px]', 'h-[52px]')

    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
