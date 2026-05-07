import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace p-[8px] with h-[36px] px-[12px] in inputs
    content = re.sub(r'p-\[8px\]( px-\[12px\])?', 'h-[36px] px-[12px]', content)
    
    # Replace py-[8px] px-[8px] with h-[36px] px-[12px] in CustomSelect 1
    content = content.replace('px-[8px] py-[8px]', 'h-[36px] px-[12px]')
    
    # Replace px-[12px] py-[8px] with h-[36px] px-[12px] in CustomSelect 2
    content = content.replace('px-[12px] py-[8px]', 'h-[36px] px-[12px]')
    
    # Fix the 搜索功能名称 input which had p-[8px] px-[12px] before but now might be h-[36px] px-[12px] h-[36px] px-[12px] 
    # Actually my regex `p-\[8px\]( px-\[12px\])?` handles it safely.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_file('src/views/AdminView.jsx')
