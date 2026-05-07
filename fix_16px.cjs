const fs = require('fs');

function makeAllInputs16px() {
  // 1. Fix HomeView.jsx
  const homeViewPath = 'src/views/HomeView.jsx';
  let homeViewContent = fs.readFileSync(homeViewPath, 'utf8');

  // We know the exact classes used for inputs and selects in HomeView.
  // They are either `text-[14px]` or `text-[13px] sm:text-[14px]`.
  // Let's replace them inside className and textColor strings specifically.
  // We don't want to replace label sizes, only input/select values.
  
  // Replace text-[13px] sm:text-[14px] in input classes
  homeViewContent = homeViewContent.replace(
    /className="([^"]*)text-\[13px\] sm:text-\[14px\]([^"]*)"/g,
    'className="$1text-[16px]$2"'
  );
  
  // Replace text-[14px] in input classes (for address, vin, etc)
  homeViewContent = homeViewContent.replace(
    /className="([^"]*)text-\[14px\] flex-1([^"]*)"/g,
    'className="$1text-[16px] flex-1$2"'
  );

  // Replace textColor sizes
  homeViewContent = homeViewContent.replace(
    /textColor="([^"]*)text-\[13px\] sm:text-\[14px\]([^"]*)"/g,
    'textColor="$1text-[16px]$2"'
  );
  homeViewContent = homeViewContent.replace(
    /textColor="([^"]*)text-\[14px\]([^"]*)"/g,
    'textColor="$1text-[16px]$2"'
  );

  fs.writeFileSync(homeViewPath, homeViewContent, 'utf8');

  // 2. Fix EditSessionModal.jsx
  const modalPath = 'src/components/EditSessionModal.jsx';
  let modalContent = fs.readFileSync(modalPath, 'utf8');

  // Fix inputCls
  modalContent = modalContent.replace(
    /const inputCls = '([^']*)text-\[15px\]([^']*)';/g,
    "const inputCls = '$1text-[16px]$2';"
  );

  // Fix injected textColor
  modalContent = modalContent.replace(
    /textColor="([^"]*)text-\[15px\]"/g,
    'textColor="$1text-[16px]"'
  );

  fs.writeFileSync(modalPath, modalContent, 'utf8');
  console.log('Fixed all inputs and selects to 16px');
}

makeAllInputs16px();
