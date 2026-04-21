import json

with open("C:/Users/HG/.gemini/antigravity/brain/7ce3de63-9951-49b2-8982-edb3fd9bb73d/.system_generated/steps/2919/output.txt", "r", encoding="utf-8") as f:
    data = json.load(f)

for child in data:
    if child.get("type") == "frame" and child.get("width") == 412 and child.get("height") == 916:
        print(f"{child.get('id')} - {child.get('name')} (y={child.get('y',0)})")
