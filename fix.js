const fs = require('fs');
let code = fs.readFileSync('src/views/AdminView.jsx', 'utf8');

// The file was restored, so it's in its initial state from the last commit.
// We need to apply:
// 1. align="between" is ALREADY there? Let's check.
// 2. Change '按功能大类筛选' to '全部功能'
// 3. Make options: [{value:'',label:'全部功能'}, ...uniqueFunctionCategories]

console.log("Has align=between?", code.includes('align="between"'));
console.log("Has 按功能大类筛选?", code.includes('按功能大类筛选'));

code = code.replace(
  `options={['', ...uniqueFunctionCategories]}`,
  `options={[{value:'',label:'全部功能'}, ...uniqueFunctionCategories]}`
);

code = code.replace(
  `placeholder="按功能大类筛选"`,
  `placeholder="全部功能"`
);

// We also changed HistoryView earlier to '全部架构'. Let's verify it worked.
let histCode = fs.readFileSync('src/views/HistoryView.jsx', 'utf8');
console.log("HistoryView has 全部架构?", histCode.includes('全部架构'));

fs.writeFileSync('src/views/AdminView.jsx', code, 'utf8');
console.log('Fixed AdminView');
