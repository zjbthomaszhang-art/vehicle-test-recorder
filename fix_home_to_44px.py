import os

filepath = 'src/views/HomeView.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace h-[48px] to h-[44px], but be careful not to touch w-[48px]
content = content.replace('h-[48px]', 'h-[44px]')
content = content.replace('min-h-[48px]', 'min-h-[44px]')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated {filepath} to 44px")
