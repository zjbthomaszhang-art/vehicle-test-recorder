const fs = require('fs');

function changeToPercentages() {
  const file = 'src/views/HomeView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Replace flex-[53] with w-[50%]
  content = content.replace(/flex-\[53\]/g, 'w-[50%]');
  
  // Replace flex-[47] with w-[40%]
  content = content.replace(/flex-\[47\]/g, 'w-[40%]');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed widths to 50% and 40%');
}

changeToPercentages();
