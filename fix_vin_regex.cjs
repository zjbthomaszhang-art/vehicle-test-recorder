const fs = require('fs');

function fixVinRegex() {
  // Fix HomeView.jsx
  const homeViewPath = 'src/views/HomeView.jsx';
  let homeViewContent = fs.readFileSync(homeViewPath, 'utf8');

  homeViewContent = homeViewContent.replace(
    /onChange=\{\(e\) => \{\s*const val = e\.target\.value;\s*setVin\(val\.slice\(0, 17\)\);\s*const decodedYear = decodeModelYearFromVin\(val\.toUpperCase\(\)\);\s*if \(decodedYear\) setModelYear\(decodedYear\);\s*\}\}/g,
    `onChange={(e) => {
              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
              setVin(val.slice(0, 17));
              const decodedYear = decodeModelYearFromVin(val.toUpperCase());
              if (decodedYear) setModelYear(decodedYear);
            }}`
  );

  fs.writeFileSync(homeViewPath, homeViewContent, 'utf8');

  // Fix EditSessionModal.jsx
  const modalPath = 'src/components/EditSessionModal.jsx';
  let modalContent = fs.readFileSync(modalPath, 'utf8');

  modalContent = modalContent.replace(
    /onChange=\{\(e\) => \{\s*const val = e\.target\.value\.slice\(0, 17\);\s*const decodedYear = decodeModelYearFromVin\(val\.toUpperCase\(\)\);\s*setFormData\(prev => \(\{\s*\.\.\.prev,\s*vin: val,\s*\.\.\.\(decodedYear \? \{ model_year: decodedYear \} : \{\}\)\s*\}\)\);\s*\}\}/g,
    `onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 17);
                const decodedYear = decodeModelYearFromVin(val.toUpperCase());
                setFormData(prev => ({
                  ...prev,
                  vin: val,
                  ...(decodedYear ? { model_year: decodedYear } : {})
                }));
              }}`
  );

  fs.writeFileSync(modalPath, modalContent, 'utf8');
  console.log('Fixed VIN to only allow alphanumeric characters');
}

fixVinRegex();
