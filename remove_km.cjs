const fs = require('fs');

function removeKm() {
  const homeViewPath = 'src/views/HomeView.jsx';
  let homeViewContent = fs.readFileSync(homeViewPath, 'utf8');
  // Remove the line with km in HomeView
  homeViewContent = homeViewContent.replace(/\{mileage && <span className="text-\[#64748b\] text-\[12px\] font-\[500\] shrink-0">km<\/span>\}/g, '');
  fs.writeFileSync(homeViewPath, homeViewContent, 'utf8');

  const modalPath = 'src/components/EditSessionModal.jsx';
  let modalContent = fs.readFileSync(modalPath, 'utf8');
  // Remove the line with km in EditSessionModal
  modalContent = modalContent.replace(/\{formData\.mileage && <span className="text-\[#64748b\] text-\[13px\] font-\[500\] shrink-0">km<\/span>\}/g, '');
  fs.writeFileSync(modalPath, modalContent, 'utf8');

  console.log('Removed km from both files');
}

removeKm();
