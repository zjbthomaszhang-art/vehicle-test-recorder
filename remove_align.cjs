const fs = require('fs');

function removeAlignLeft() {
  const file = 'src/views/HomeView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Replace `align="left"` with nothing
  content = content.replace(/\s*align="left"/g, '');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Removed align="left" from HomeView.jsx');
}

removeAlignLeft();
