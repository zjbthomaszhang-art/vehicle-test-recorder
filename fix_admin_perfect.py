import codecs

with codecs.open('src/views/AdminView.jsx', 'r', 'utf-8', errors='ignore') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'uniqueFunctionCategories]' in line:
        # We found the options line!
        # Let's replace the CustomSelect lines around it.
        # The structure is:
        # <CustomSelect
        #   [textColor if present]
        #   value={filterCat}
        #   onChange={setFilterCat}
        #   options=...
        #   placeholder=...
        #   align=...
        
        lines[i] = "                options={[{value:'',label:'全部功能'}, ...uniqueFunctionCategories]}\n"
        
        # Now find the placeholder which should be right below it
        for j in range(i, i+5):
            if 'placeholder=' in lines[j] and 'input' not in lines[j]:
                lines[j] = '                placeholder="按功能大类筛选"\n'
            if 'align=' in lines[j]:
                lines[j] = '                align="between"\n'
        
        # Add textColor if missing
        has_text_color = False
        for j in range(i-5, i):
            if 'textColor=' in lines[j]:
                has_text_color = True
                
        if not has_text_color:
            # insert textColor above value={filterCat}
            for j in range(i-5, i):
                if 'value={filterCat}' in lines[j]:
                    lines.insert(j, '                textColor="text-slate-900 dark:text-white text-[16px]"\n')
                    break
        break

with codecs.open('src/views/AdminView.jsx', 'w', 'utf-8') as f:
    f.writelines(lines)

print("AdminView perfectly fixed via logic.")
