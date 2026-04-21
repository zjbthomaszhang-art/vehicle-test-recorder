import json

def find_nodes(node, ids_to_find):
    # This is just a helper, I'll print everything to identify
    pass

try:
    with open('C:/Users/HG/.gemini/antigravity/brain/7ce3de63-9951-49b2-8982-edb3fd9bb73d/.system_generated/steps/3308/output.txt', encoding='utf-8') as f:
        data = json.load(f)

    for frame in data:
        print(f"\n--- Frame: {frame.get('name')} ({frame['id']}) ---")
        # Header area
        hdr = next((c for c in frame.get('children', []) if c.get('name') == 'hd'), {})
        if hdr:
            # Back button is usually the first child of hdr if it exists
            for hc in hdr.get('children', []):
                print(f"  HDR Child: {hc.get('id')} {hc.get('name')} {hc.get('type')} {hc.get('content', '')}")
                # Menu area in hdr
                if hc.get('name') == 'm':
                    for mc in hc.get('children', []):
                        print(f"    Menu Child: {mc.get('id')} {mc.get('name')} {mc.get('content', '')}")

        # Scroll area for cards
        scroll = next((c for c in frame.get('children', []) if c.get('name') == 'scroll'), {})
        if scroll:
            for card in scroll.get('children', []):
                if card.get('type') == 'frame':
                    print(f"  Card: {card.get('id')} {card.get('name')}")
                    for cc in card.get('children', []):
                        # Status tag is usually a frame with name like 'tag' or matching '阻塞'
                        print(f"    Card Child: {cc.get('id')} {cc.get('name')} {cc.get('content', '')}")
                        if cc.get('name') == 'ft': # footer of card usually contains '查看状态'
                             for fc in cc.get('children', []):
                                 print(f"      Card FT Child: {fc.get('id')} {fc.get('content', '')}")

        # Primary button
        btn = next((c for c in frame.get('children', []) if 'btn' in c.get('name', '').lower() or 'footer' in c.get('name', '').lower()), {})
        if btn:
             print(f"  Primary Btn Frame: {btn.get('id')} {btn.get('name')}")

except Exception as e:
    print(f"Error: {e}")
