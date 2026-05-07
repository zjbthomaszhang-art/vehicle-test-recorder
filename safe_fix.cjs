const fs = require('fs');

function fixFiles() {
  console.log("Fixing EditSessionModal 16px...");
  let modalStr = fs.readFileSync('src/components/EditSessionModal.jsx', 'utf8');
  modalStr = modalStr.replace(/text-\[15px\] w-1\/2/, "text-[16px] w-1/2");
  // Also fix selectCls if it is 15px
  modalStr = modalStr.replace(/text-\[15px\] w-1\/2 appearance-none/, "text-[16px] w-1/2 appearance-none");
  fs.writeFileSync('src/components/EditSessionModal.jsx', modalStr, 'utf8');

  console.log("Fixing AdminView duplicate textColor...");
  let adminStr = fs.readFileSync('src/views/AdminView.jsx', 'utf8');
  // Remove all textColor attributes
  adminStr = adminStr.replace(/\s*textColor="text-slate-900 dark:text-white.*?"/g, '');
  // Re-inject exactly once for CustomSelect
  adminStr = adminStr.replace(/<CustomSelect/g, '<CustomSelect\n                textColor="text-slate-900 dark:text-white text-[16px]"');
  fs.writeFileSync('src/views/AdminView.jsx', adminStr, 'utf8');
}

fixFiles();
