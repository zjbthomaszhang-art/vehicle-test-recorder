import os

files_to_fix = [
    'src/App.jsx',
    'src/views/DashboardView.jsx',
    'src/views/PDCAView.jsx'
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The buggy sort
    old_code = "new Date(b.timestamp || 0) - new Date(a.timestamp || 0)"
    new_code = "new Date(String(b.timestamp || 0).replace(/-/g, '/')) - new Date(String(a.timestamp || 0).replace(/-/g, '/'))"
    
    if old_code in content:
        content = content.replace(old_code, new_code)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed iOS sort in {filepath}")
