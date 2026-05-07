const fs = require('fs');

function fixHomeView() {
  const file = 'src/views/HomeView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Replace height
  content = content.replace(/h-\[54px\]/g, 'h-[40px]');

  // Swap Row 1 and Row 2
  // We need to carefully extract the two blocks.
  
  const row1Start = content.indexOf('{/* Group 1: 生产年份 & 工程代码 */}');
  const row2Start = content.indexOf('{/* Row 2: VIN */}');
  const row3Start = content.indexOf('{/* Group 2: 生产阶段 & 总里程数 */}');

  if (row1Start > -1 && row2Start > -1 && row3Start > -1) {
    const row1Block = content.substring(row1Start, row2Start);
    const row2Block = content.substring(row2Start, row3Start);
    
    // The order is currently row1Block then row2Block. We want row2Block then row1Block.
    const before = content.substring(0, row1Start);
    const after = content.substring(row3Start);

    content = before + row2Block + row1Block + after;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed HomeView.jsx');
  } else {
    console.log('Could not find row markers in HomeView.jsx');
  }
}

function fixModal() {
  const file = 'src/components/EditSessionModal.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Replace height in FieldRow component
  content = content.replace(/h-\[54px\]/g, 'h-[40px]');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed EditSessionModal.jsx');
}

fixHomeView();
fixModal();
