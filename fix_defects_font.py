import os

filepath = 'src/views/DefectsView.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the 11px semi-bold with 12px black for the KPI card titles
content = content.replace('className="text-[11px] font-[600] text-slate-500 dark:text-[#cbd5e1]">总计缺陷', 'className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">总计缺陷')
content = content.replace('className="text-[11px] font-[600] text-slate-500 dark:text-[#cbd5e1]">未解决', 'className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">未解决')
content = content.replace('className="text-[11px] font-[600] text-slate-500 dark:text-[#cbd5e1]">处理中', 'className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">处理中')
content = content.replace('className="text-[11px] font-[600] text-slate-500 dark:text-[#cbd5e1]">已解决', 'className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">已解决')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated {filepath}")
