import json

def find_text_recursively(node, targets):
    if node.get('type') == 'text':
        content = node.get('content', '')
        if any(t in content for t in targets):
            print(f"FOUND: ID={node['id']}, Content='{content}'")
    
    children = node.get('children', [])
    for child in children:
        if isinstance(child, dict):
            find_text_recursively(child, targets)

try:
    with open('C:/Users/HG/.gemini/antigravity/brain/7ce3de63-9951-49b2-8982-edb3fd9bb73d/.system_generated/steps/3263/output.txt', encoding='utf-8') as f:
        data = json.load(f)
    
    search_terms = ['用例导航', 'NAVIGATOR']
    if isinstance(data, list):
        for frame in data:
            find_text_recursively(frame, search_terms)
    else:
        find_text_recursively(data, search_terms)

except Exception as e:
    print(f"Error: {e}")
