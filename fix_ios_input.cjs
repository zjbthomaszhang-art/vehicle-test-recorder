const fs = require('fs');

function fixIosInputs() {
  // Fix HomeView.jsx
  const homeViewPath = 'src/views/HomeView.jsx';
  let homeViewContent = fs.readFileSync(homeViewPath, 'utf8');

  // Fix VIN in HomeView
  homeViewContent = homeViewContent.replace(
    /onChange=\{\(e\) => \{\s*const val = e\.target\.value\.toUpperCase\(\);\s*setVin\(val\.slice\(0, 17\)\);\s*const decodedYear = decodeModelYearFromVin\(val\);\s*if \(decodedYear\) setModelYear\(decodedYear\);\s*\}\}/g,
    `onChange={(e) => {
              const val = e.target.value;
              setVin(val.slice(0, 17));
              const decodedYear = decodeModelYearFromVin(val.toUpperCase());
              if (decodedYear) setModelYear(decodedYear);
            }}
            onBlur={() => setVin(v => v.toUpperCase())}`
  );

  // Fix Engineering Code (vehicleModel) in HomeView
  homeViewContent = homeViewContent.replace(
    /onChange=\{\(e\) => setVehicleModel\(e\.target\.value\.toUpperCase\(\)\)\}/g,
    `onChange={(e) => setVehicleModel(e.target.value)}
              onBlur={() => setVehicleModel(v => v.toUpperCase())}`
  );

  fs.writeFileSync(homeViewPath, homeViewContent, 'utf8');

  // Fix EditSessionModal.jsx
  const modalPath = 'src/components/EditSessionModal.jsx';
  let modalContent = fs.readFileSync(modalPath, 'utf8');

  // Fix Engineering Code in EditSessionModal
  modalContent = modalContent.replace(
    /onChange=\{set\('vehicleModel', v => v\.toUpperCase\(\)\)\}/g,
    `onChange={set('vehicleModel')}
              onBlur={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value.toUpperCase() }))}`
  );

  // Fix VIN in EditSessionModal
  modalContent = modalContent.replace(
    /onChange=\{\(e\) => \{\s*const val = e\.target\.value\.toUpperCase\(\)\.slice\(0, 17\);\s*const decodedYear = decodeModelYearFromVin\(val\);\s*setFormData\(prev => \(\{\s*\.\.\.prev,\s*vin: val,\s*\.\.\.\(decodedYear \? \{ model_year: decodedYear \} : \{\}\)\s*\}\)\);\s*\}\}/g,
    `onChange={(e) => {
                const val = e.target.value.slice(0, 17);
                const decodedYear = decodeModelYearFromVin(val.toUpperCase());
                setFormData(prev => ({
                  ...prev,
                  vin: val,
                  ...(decodedYear ? { model_year: decodedYear } : {})
                }));
              }}
              onBlur={(e) => setFormData(prev => ({ ...prev, vin: e.target.value.toUpperCase() }))}`
  );

  fs.writeFileSync(modalPath, modalContent, 'utf8');
  console.log('Fixed iOS input issues for VIN and Engineering Code');
}

fixIosInputs();
