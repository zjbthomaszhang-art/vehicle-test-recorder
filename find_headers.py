import json
try:
    with open('C:/Users/HG/.gemini/antigravity/brain/7ce3de63-9951-49b2-8982-edb3fd9bb73d/.system_generated/steps/3188/output.txt', encoding='utf-8') as f:
        data = json.load(f)
except Exception as e:
    print(f"Error loading file: {e}")
    exit(1)

targets = ['TIMING CAPTURE', 'FINAL VERDICT', 'NOTES & MEDIA', 'TEST EXECUTION']
results = []

def find_text(node):
    if node.get('type') == 'text':
        content = node.get('content', '').upper()
        if any(t in content for t in targets):
            results.append({'id': node['id'], 'content': node['content']})
    for child in node.get('children', []):
        if isinstance(child, dict):
            find_text(child)

for n in data:
    find_text(n)

print(json.dumps(results, indent=2))
