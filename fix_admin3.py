path = '/home/admin/vehicle-test-recorder/src/views/AdminView.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixes = {
    35: "        if (typeof setToast === 'function') setToast({ message: 'VIN\u89e3\u6790\u8868\u5df2\u66f4\u65b0\uff0c\u5171 ' + data.count + ' \u6761\u89c4\u5219', type: 'success' });\n",
    69: "      if (typeof setToast === 'function') setToast({ message: '\u5fc5\u586b\u5b57\u6bb5\u4e0d\u5b8c\u6574', type: 'error' });\n",
    131: "           if (typeof setToast === 'function') setToast({ message: '\u6587\u4ef6\u4e3a\u7a7a\u6216\u683c\u5f0f\u9519\u8bef', type: 'error' });\n",
    168: "                   if (typeof setToast === 'function') setToast({ message: '\u5bfc\u5165\u6210\u529f ' + mappedCases.length + ' \u6761\u8bb0\u5f55', type: 'success' });\n",
    174: "           if (typeof setToast === 'function') setToast({ message: '\u672a\u627e\u5230\u6709\u6548\u6570\u636e', type: 'error' });\n",
}

for lineno, new_content in fixes.items():
    old = lines[lineno - 1]
    lines[lineno - 1] = new_content
    print(f"L{lineno}: {old.strip()!r:.60} -> fixed")

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("ALL DONE")
