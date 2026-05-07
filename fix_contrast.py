import os
import glob

views_dir = 'src/views/'
comp_dir = 'src/components/'
files = glob.glob(os.path.join(views_dir, '*.jsx')) + glob.glob(os.path.join(comp_dir, '*.jsx'))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Backgrounds
    content = content.replace('dark:bg-[#111827]', 'dark:bg-[#1e293b]')
    content = content.replace('dark:bg-[#121826]', 'dark:bg-[#1e293b]')
    content = content.replace('dark:bg-[#0a0f1e]', 'dark:bg-[#1e293b]')
    content = content.replace('dark:bg-[#0f172a]', 'dark:bg-[#334155]')
    
    # Borders
    content = content.replace('dark:border-[#334155]', 'dark:border-[#475569]')
    content = content.replace('dark:border-[#1e293b]', 'dark:border-[#334155]')

    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
