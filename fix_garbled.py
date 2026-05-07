import codecs
import re

with codecs.open('src/views/AdminView.jsx', 'r', 'utf-8', errors='replace') as f:
    content = f.read()

# Fix the garbled "options=" line
content = re.sub(r"options=\{\[\{value:'',label:'.*?'\}, \.\.\.uniqueFunctionCategories\]\}", "options={[{value:'',label:'全部功能'}, ...uniqueFunctionCategories]}", content)
content = re.sub(r"options=\{\['', \.\.\.uniqueFunctionCategories\]\}", "options={[{value:'',label:'全部功能'}, ...uniqueFunctionCategories]}", content)

# Fix the garbled placeholder
content = re.sub(r'placeholder=".*?ɸѡ.*?"', 'placeholder="按功能大类筛选"', content)
content = re.sub(r'placeholder="按功能大类筛.*?"', 'placeholder="按功能大类筛选"', content)

# Fix other garbled texts I saw
content = content.replace("绛涢€夌敤渚?", "筛选用例")
content = content.replace("鎼滅储鍔熻兘鍚嶇О...", "搜索功能名称...")
content = content.replace("褰撳墠妗堜緥鏁?", "当前案例数")
content = content.replace("瀵煎叆", "导入")
content = content.replace("纭鍒犻櫎妗堜緥锛?", "确认删除案例？")
content = content.replace("姝ゆ搷浣滀笉鍙仮澶嶃€傛渚嬬殑鍒犻櫎鍙兘浼氬奖鍝嶇浉鍏冲巻鍙叉墽琛岃褰曠殑鏁版嵁鍏宠仈銆?", "此操作不可恢复。案例的删除可能会影响相关历史执行记录的数据关联。")
content = content.replace("鍙栨秷", "取消")
content = content.replace("纭鍒犻櫎", "确认删除")

# Fix VIN upload success/error garbled
content = content.replace("VIN瑙ｆ瀽琛ㄥ凡鏇存柊锛屽叡", "VIN解析表已更新，共")
content = content.replace("鏉¤鍒檂", "条规则")
content = content.replace("涓婁紶澶辫触锛?", "上传失败：")

with codecs.open('src/views/AdminView.jsx', 'w', 'utf-8') as f:
    f.write(content)

print("AdminView.jsx cleaned and fixed.")
