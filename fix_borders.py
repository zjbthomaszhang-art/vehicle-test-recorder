import os
import glob
import re

views_dir = 'src/views/'
comp_dir = 'src/components/'
files = glob.glob(os.path.join(views_dir, '*.jsx')) + glob.glob(os.path.join(comp_dir, '*.jsx'))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Unify all transparent or missing dark borders to #334155 (Slate 700)
    # This will match dark:border-transparent and change it to a visible border.
    content = content.replace('dark:border-transparent', 'dark:border-[#334155]')

    # Clean up any duplicated dark:border classes if they exist from previous regexes
    # Example: border border-slate-200/60 dark:border-[#334155] border border-slate-200 dark:border-[#334155]
    content = re.sub(r'border border-slate-[0-9]+(/[0-9]+)? dark:border-\[[#A-Za-z0-9]+\](/[0-9]+)?\s+border border-slate-[0-9]+(/[0-9]+)? dark:border-\[[#A-Za-z0-9]+\](/[0-9]+)?', 
                     r'border border-slate-200 dark:border-[#334155]', content)
    
    # Some buttons use border-[#3c3c43] or similar, let's leave them if they are very specific,
    # but unify anything that is #1e293b or transparent.
    content = content.replace('dark:border-[#1e293b]', 'dark:border-[#334155]')

    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
