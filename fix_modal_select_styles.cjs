const fs = require('fs');

function fixModalSelectStyles() {
  const file = 'src/components/EditSessionModal.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Inject textColor prop into all CustomSelect components
  content = content.replace(
    /<CustomSelect/g,
    '<CustomSelect\n              textColor="text-slate-900 dark:text-white font-[700] text-[15px]"'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed modal select font styles');
}

fixModalSelectStyles();
