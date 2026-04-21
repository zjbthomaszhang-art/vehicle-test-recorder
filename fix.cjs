const fs = require('fs');
const children = fs.readFileSync('C:/Users/HG/.gemini/antigravity/brain/78c5e79a-281e-46c2-add6-ec4c8d081f18/.system_generated/steps/27/output.txt', 'utf8');

let penJson = JSON.stringify({
  version: '2.10',
  children: [
    {
      type: 'frame',
      id: '2qLS9',
      name: 'Dashboard - PC (Main Branch)',
      width: 1280,
      height: 800,
      fill: '#0f172a',
      layout: 'vertical',
      gap: 24,
      padding: 24,
      children: JSON.parse(children)
    }
  ]
});

// Fix the node "children": "..." bad schema issue created by batch_get
penJson = penJson.replace(/"children":"\.\.\."/g, '"children":[]');

fs.writeFileSync('./dashboard-pc.pen', penJson, 'utf8');
console.log('Fixed file generated');
