const fs = require('fs');

function changeRatio() {
  const file = 'src/views/HomeView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Replace flex-[55] (left items) with flex-[53]
  content = content.replace(/className="flex-\[55\]/g, 'className="flex-[53]');
  
  // Replace flex-[45] (right items) with flex-[47]
  content = content.replace(/className="flex-\[45\]/g, 'className="flex-[47]');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed ratios to 53 and 47');
}

changeRatio();
