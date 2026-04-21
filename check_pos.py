import json
data = json.load(open('C:/Users/HG/.gemini/antigravity/brain/7ce3de63-9951-49b2-8982-edb3fd9bb73d/.system_generated/steps/3053/output.txt', encoding='utf-8'))
for n in data:
    print(f"{n['id']:8} x={n.get('x',0):5} y={n.get('y',0):5}  {n.get('name','')}")
