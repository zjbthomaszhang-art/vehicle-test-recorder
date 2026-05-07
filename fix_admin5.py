path = '/home/admin/vehicle-test-recorder/src/views/AdminView.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix line 218: add closing )} after the fragment
# Current: '                      <> &nbsp;·&nbsp; 更新于 {new Date(vinStatus.uploaded_at).toLocaleDateString("zh-CN")}</>\n'
# Should end with: </> )}\n
fixes = {
    218: '                      <> &nbsp;\u00b7&nbsp; \u66f4\u65b0\u4e8e {new Date(vinStatus.uploaded_at).toLocaleDateString("zh-CN")}</>\n                    )}\n',
    219: '                  </span>\n',
}

# We need to insert the )} properly
# Line 218 should be:   <> ... </>
# Line 219 should be:                     )}   <- closing the vinStatus.uploaded_at &&
# Line 220 should be:                   </span>

# Let's just rewrite lines 218-220
new_block = [
    '                      <> &nbsp;\u00b7&nbsp; \u66f4\u65b0\u4e8e {new Date(vinStatus.uploaded_at).toLocaleDateString("zh-CN")}</>\n',
    '                    )}\n',
    '                  </span>\n',
    '                </div>\n',
    '              )}\n',
]

# Check current lines 218-222
print("Current lines 218-222:")
for i in range(217, 222):
    print(f"  L{i+1}: {lines[i].rstrip()!r}")

# Replace lines 218-222 with new_block
lines[217:222] = new_block

print("\nNew lines 218-222:")
for i in range(217, 222):
    print(f"  L{i+1}: {lines[i].rstrip()!r}")

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("DONE")
