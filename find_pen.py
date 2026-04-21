import json

if __name__ == "__main__":
    with open("mobile-views.pen", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    target_ids = ["adFldIdPh", "adFldCatPh", "adFldFCatPh", "adFldFnPh", "adFldTypePh", "adRow3Ph", "adRow4Ph", "adFilterSelPh", "adSearchPh",
                  "alFldIdPh", "alFldCatPh", "alFldFCatPh", "alFldFnPh", "alFldTypePh", "alRow3Ph", "alRow4Ph", "alFilterSelPh", "alSearchPh"]
    
    def find_parent(node, target_ids):
        found = []
        if isinstance(node, dict):
            children = node.get("children", [])
            for child in children:
                if child.get("id") in target_ids:
                    found.append((node, child))
            for child in children:
                found.extend(find_parent(child, target_ids))
        return found
        
    parents = find_parent(data, target_ids)
    for p, c in parents:
        print(f"Parent Layout for '{c.get('content')}':")
        print({k: v for k, v in p.items() if k not in ["children"]})
