import json
try:
    with open('C:/Users/HG/.gemini/antigravity/brain/7ce3de63-9951-49b2-8982-edb3fd9bb73d/.system_generated/steps/3188/output.txt', encoding='utf-8') as f:
        data = json.load(f)
except Exception as e:
    print(f"Error loading file: {e}")
    exit(1)

def find_all_text(node):
    if node.get('type') == 'text':
        print(f"{node['id']}: {node['content']}")
    for child in node.get('children', []):
        if isinstance(child, dict):
            find_all_text(child)

for n in data:
    print(f"--- Frame: {n.get('name')} ---")
    find_all_text(n)
