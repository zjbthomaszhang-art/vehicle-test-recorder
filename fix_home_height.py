import os

filepath = 'src/views/HomeView.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('h-[52px]', 'h-[48px]')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated {filepath}")
