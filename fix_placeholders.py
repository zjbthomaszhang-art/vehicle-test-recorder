import codecs

def replace_in_file(filepath, old_text, new_text):
    with codecs.open(filepath, 'r', 'utf-8') as f:
        content = f.read()
    content = content.replace(old_text, new_text)
    with codecs.open(filepath, 'w', 'utf-8') as f:
        f.write(content)

# AdminView.jsx
# Revert placeholder to "按功能大类筛选"
replace_in_file('src/views/AdminView.jsx', 'placeholder="全部功能"', 'placeholder="按功能大类筛选"')

# HistoryView.jsx
# Revert placeholder to "总线架构"
replace_in_file('src/views/HistoryView.jsx', 'placeholder="全部架构"', 'placeholder="总线架构"')

# DefectsView.jsx
# Option label needs to be '全部状态', placeholder is '状态'
replace_in_file('src/views/DefectsView.jsx', "options={[{value:'',label:'状态'},", "options={[{value:'',label:'全部状态'},")

print("Files successfully updated with correct placeholders and options.")
