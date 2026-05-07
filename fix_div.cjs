const fs = require('fs');
let content = fs.readFileSync('src/views/HomeView.jsx', 'utf8');
content = content.replace('        </div>\n        </div>\n\n        {/* Row 11: 备注 */}', '        </div>\n\n        {/* Row 11: 备注 */}');
fs.writeFileSync('src/views/HomeView.jsx', content, 'utf8');
console.log('Fixed div');
