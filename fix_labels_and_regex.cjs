const fs = require('fs');

function fixAll() {
  // 1. HomeView.jsx Fixes
  let homeViewPath = 'src/views/HomeView.jsx';
  let homeViewContent = fs.readFileSync(homeViewPath, 'utf8');

  // A. Revert labels
  homeViewContent = homeViewContent.replace(
    /className="text-\[16px\] font-\[600\] text-slate-500 dark:text-\[#94a3b8\] whitespace-nowrap"/g,
    'className="text-[13px] sm:text-[14px] font-[600] text-slate-500 dark:text-[#94a3b8] whitespace-nowrap"'
  );

  // B. Engineering Code Alphanumeric
  homeViewContent = homeViewContent.replace(
    /onChange=\{\(e\) => setVehicleModel\(e\.target\.value\)\}/g,
    "onChange={(e) => setVehicleModel(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}"
  );

  fs.writeFileSync(homeViewPath, homeViewContent, 'utf8');

  // 2. EditSessionModal.jsx Fixes
  let modalPath = 'src/components/EditSessionModal.jsx';
  let modalContent = fs.readFileSync(modalPath, 'utf8');

  // A. Engineering Code Alphanumeric
  modalContent = modalContent.replace(
    /onChange=\{set\('vehicleModel'\)\}/g,
    "onChange={set('vehicleModel', v => v.replace(/[^a-zA-Z0-9]/g, ''))}"
  );

  fs.writeFileSync(modalPath, modalContent, 'utf8');

  // 3. AdminView.jsx Fixes
  let adminViewPath = 'src/views/AdminView.jsx';
  let adminViewContent = fs.readFileSync(adminViewPath, 'utf8');

  // A. Change text-[12px] to text-[16px] font-[700] for all inputs
  adminViewContent = adminViewContent.replace(
    /text-\[12px\] text-slate-900/g,
    'text-[16px] font-[700] text-slate-900'
  );

  // B. Add textColor to CustomSelect
  adminViewContent = adminViewContent.replace(
    /<CustomSelect/g,
    '<CustomSelect\n              textColor="text-slate-900 dark:text-white font-[700] text-[16px]"'
  );

  fs.writeFileSync(adminViewPath, adminViewContent, 'utf8');

  console.log('Fixed HomeView labels, VehicleModel regex, and AdminView font sizes');
}

fixAll();
