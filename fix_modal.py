import codecs

with codecs.open('src/views/AdminView.jsx', 'r', 'utf-8', errors='ignore') as f:
    lines = f.readlines()

# Fix Modal garbled texts (around line 290+)
for i in range(len(lines)):
    if 'text-[18px] font-[900]' in lines[i]:
        lines[i] = '              <span className="text-[18px] font-[900] text-slate-900 dark:text-white">确认删除案例？</span>\n'
    elif 'text-[13px] font-[500] text-slate-500' in lines[i]:
        lines[i] = '              <span className="text-[13px] font-[500] text-slate-500 dark:text-[#94a3b8] leading-snug">此操作不可恢复。案例的删除可能会影响相关历史执行记录的数据关联。</span>\n'
    elif 'onClick={() => setDeleteConfirmId(null)}' in lines[i+1] if i+1 < len(lines) else False:
        pass # The button label is later
    if 'hover:bg-slate-100 dark:hover:bg-[#334155]' in lines[i]:
        lines[i+1] = '                取消\n'
    if 'hover:bg-red-500' in lines[i]:
        lines[i+1] = '                确认删除\n'

with codecs.open('src/views/AdminView.jsx', 'w', 'utf-8') as f:
    f.writelines(lines)

print("Fixed modal garbled lines")
