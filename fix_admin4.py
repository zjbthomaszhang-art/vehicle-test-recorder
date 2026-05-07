path = '/home/admin/vehicle-test-recorder/src/views/AdminView.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixes = {
    209: '              <span className="text-[13px] font-[800] text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">VIN \u89e3\u6790\u8868</span>\n',
    216: '                    \u5171<strong className="text-slate-700 dark:text-slate-300">{vinStatus.count}</strong> \u6761\u89c4\u5219\n',
    217: '                    {vinStatus.uploaded_at && (\n',
    218: '                      <> &nbsp;\u00b7&nbsp; \u66f4\u65b0\u4e8e {new Date(vinStatus.uploaded_at).toLocaleDateString("zh-CN")}</>\n',
    316: '                placeholder="\u6309\u529f\u80fd\u5927\u7c7b\u7b5b\u9009"\n',
}

for lineno, new_content in fixes.items():
    old = lines[lineno - 1]
    lines[lineno - 1] = new_content
    print(f"L{lineno}: fixed")

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("ALL DONE")
