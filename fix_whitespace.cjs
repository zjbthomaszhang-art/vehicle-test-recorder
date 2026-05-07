const fs = require('fs');

function fixWhitespace() {
  const file = 'src/views/HomeView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Replace w-[50%] with flex-[5]
  content = content.replace(/w-\[50\%\]/g, 'flex-[5]');
  
  // Replace w-[40%] with flex-[4]
  content = content.replace(/w-\[40\%\]/g, 'flex-[4]');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed widths to flex ratios to fill container');
}

fixWhitespace();
