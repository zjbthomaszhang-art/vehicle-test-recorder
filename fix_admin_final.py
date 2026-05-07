import codecs

with codecs.open('src/views/AdminView.jsx', 'r', 'utf-8', errors='ignore') as f:
    content = f.read()

# 1. Fix the CustomSelect options
content = content.replace("options={['', ...uniqueFunctionCategories]}", "options={[{value:'',label:'全部功能'}, ...uniqueFunctionCategories]}")

# 2. Fix the garbled placeholder
content = content.replace('placeholder="ܴɸѡ"', 'placeholder="按功能大类筛选"')

# 3. Add textColor and align="between" (lost from previous session)
old_custom_select = '''              <CustomSelect
                value={filterCat}
                onChange={setFilterCat}
                options={[{value:'',label:'全部功能'}, ...uniqueFunctionCategories]}
                placeholder="按功能大类筛选"
                align="left"'''

new_custom_select = '''              <CustomSelect
                textColor="text-slate-900 dark:text-white text-[16px]"
                value={filterCat}
                onChange={setFilterCat}
                options={[{value:'',label:'全部功能'}, ...uniqueFunctionCategories]}
                placeholder="按功能大类筛选"
                align="between"'''

content = content.replace(old_custom_select, new_custom_select)

# Write back
with codecs.open('src/views/AdminView.jsx', 'w', 'utf-8') as f:
    f.write(content)

print("AdminView CustomSelect fixed")
