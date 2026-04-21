import json

def modify_parents(node, target_ids):
    if isinstance(node, dict):
        children = node.get("children", [])
        for child in children:
            if child.get("id") in target_ids:
                # Modifying parent node `node`
                if node.get("justifyContent") == "center":
                    node["justifyContent"] = "flex_start"
                    node["alignItems"] = "center"
        for child in children:
            modify_parents(child, target_ids)
            
if __name__ == "__main__":
    with open("mobile-views.pen", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    target_ids = [
        "adFldIdPh", "adFldCatPh", "adFldFCatPh", "adFldFnPh", "adRow3Ph", "adRow4Ph", "adSearchPh",
        "alFldIdPh", "alFldCatPh", "alFldFCatPh", "alFldFnPh", "alRow3Ph", "alRow4Ph", "alSearchPh"
    ]
    
    modify_parents(data, target_ids)
    
    with open("mobile-views.pen", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("Success")
