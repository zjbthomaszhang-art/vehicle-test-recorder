import codecs

with codecs.open('src/views/AdminView.jsx', 'r', 'utf-8') as f:
    content = f.read()

content = content.replace("options={['', ...uniqueFunctionCategories]}", "options={[{value:'',label:'全部功能'}, ...uniqueFunctionCategories]}")
content = content.replace('placeholder="按功能大类筛选"', 'placeholder="全部功能"')

with codecs.open('src/views/AdminView.jsx', 'w', 'utf-8') as f:
    f.write(content)

print("Fixed AdminView.jsx")
