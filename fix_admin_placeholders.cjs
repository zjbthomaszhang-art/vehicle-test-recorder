const fs = require('fs');

function fixAdminPlaceholders() {
  const file = 'src/views/AdminView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Change `text-[16px] font-[700] text-slate-900` back to `text-[16px] placeholder:text-[12px] text-slate-900`
  // This makes the typed text 16px to prevent iOS zoom, but keeps the placeholder (title) at its original 12px normal size.
  content = content.replace(
    /text-\[16px\] font-\[700\] text-slate-900/g,
    'text-[16px] placeholder:text-[12px] text-slate-900'
  );

  // For CustomSelect, remove the `font-[700]` from textColor, so it just makes the selected value 16px normal weight.
  // The placeholder will naturally fall back to 12px normal weight because of CustomSelect's internal logic.
  content = content.replace(
    /textColor="text-slate-900 dark:text-white font-\[700\] text-\[16px\]"/g,
    'textColor="text-slate-900 dark:text-white text-[16px]"'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed AdminView placeholders to remain 12px while input is 16px');
}

fixAdminPlaceholders();
