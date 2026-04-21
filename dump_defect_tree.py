import json

def print_tree(node, depth=0):
    indent = "  " * depth
    node_id = node.get("id", "??")
    node_type = node.get("type", "??")
    node_name = node.get("name", "")
    content = node.get("content", "")
    print(f"{indent}{node_id} ({node_type}) [{node_name}] {content[:30] if content else ''}")
    
    for child in node.get("children", []):
        if isinstance(child, dict):
            print_tree(child, depth + 1)

try:
    with open('C:/Users/HG/.gemini/antigravity/brain/7ce3de63-9951-49b2-8982-edb3fd9bb73d/.system_generated/steps/3308/output.txt', encoding='utf-8') as f:
        data = json.load(f)

    for frame in data:
        print(f"\nROOT: {frame.get('id')} {frame.get('name')}")
        print_tree(frame)

except Exception as e:
    print(f"Error: {e}")
