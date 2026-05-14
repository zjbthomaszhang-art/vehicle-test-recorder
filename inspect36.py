with open('src/views/AdminView.jsx', 'rb') as f:
    lines = f.readlines()

line36 = lines[35]  # 0-indexed
print(repr(line36))

# Find garbled pattern: any non-UTF8 or replacement chars
import re
# Try decoding with errors=replace to see what's broken
decoded = line36.decode('utf-8', errors='replace')
print(decoded)
print('Has replacement char:', '\ufffd' in decoded)
