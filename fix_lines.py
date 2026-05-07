import codecs

with codecs.open('src/views/AdminView.jsx', 'r', 'utf-8', errors='ignore') as f:
    lines = f.readlines()

# Replace the garbled span
lines[241] = '           <span className="text-[10px] font-[900] text-slate-500 dark:text-[#94a3b8]">筛选用例</span>\n'

# Replace the CustomSelect options and placeholder
lines[246] = "                options={[{value:'',label:'全部功能'}, ...uniqueFunctionCategories]}\n"
lines[247] = '                placeholder="按功能大类筛选"\n'

# Replace the search input placeholder
lines[251] = '                placeholder="搜索功能名称..." className="flex-1 min-w-0 w-1/2 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] p-[8px] px-[12px] text-[12px] text-slate-900 dark:text-white focus:outline-none"\n'

with codecs.open('src/views/AdminView.jsx', 'w', 'utf-8') as f:
    f.writelines(lines)

print("Fixed AdminView.jsx specific lines")
