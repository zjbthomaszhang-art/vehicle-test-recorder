const fs = require('fs');

function fixTo5050() {
  const file = 'src/views/HomeView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Replace flex-[5] with flex-1
  content = content.replace(/flex-\[5\]/g, 'flex-1');
  
  // Replace flex-[4] with flex-1
  content = content.replace(/flex-\[4\]/g, 'flex-1');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed widths to flex-1 (50/50)');
}

fixTo5050();
