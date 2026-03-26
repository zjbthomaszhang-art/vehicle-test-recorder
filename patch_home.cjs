const fs = require('fs');
const file = './src/views/HomeView.jsx';
let content = fs.readFileSync(file, 'utf8');

const modelTesterGrid = `          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Car size={14} className="text-blue-500" /> Vehicle Model
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value.toUpperCase())}
                placeholder="e.g. NDLB"
                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-5 font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all shadow-inner uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Car size={14} className="text-blue-500" /> Tester
              </label>
              <input
                type="text"
                value={tester}
                onChange={(e) => setTester(e.target.value)}
                placeholder="Tester Name"
                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-5 font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
              />
            </div>
          </div>`;

const vinMileageGrid = `          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Info size={14} className="text-blue-500" /> VIN
              </label>
              <input
                type="text"
                value={vin}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  if (val.length > 17) {
                    setToast({ message: 'VIN cannot exceed 17 characters', type: 'error' });
                    return;
                  }
                  setVin(val);
                  const decodedYear = decodeModelYearFromVin(val);
                  if (decodedYear) setModelYear(decodedYear);
                }}
                placeholder="17-digit VIN"
                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-4 font-mono text-blue-400 focus:outline-none focus:border-blue-500/50 uppercase tracking-wider text-[11px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Info size={14} className="text-blue-500" /> 总里程数(KM)
              </label>
              <input
                type="text"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="e.g., 12000"
                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-5 font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
              />
            </div>
          </div>`;

const startStr = '<section className="space-y-5">\n          {/* Model and MY side by side */}';
const endStr = '<div className="space-y-2">\n          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">\n            <MapPin size={14} className="text-blue-500" /> Address';

const startIndex = content.indexOf('<section className="space-y-5">');
const endIndex = content.indexOf('<div className="space-y-2">\n          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">\n            <MapPin size={14} className="text-blue-500" /> Address');

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = '<section className="space-y-5">\n' + modelTesterGrid + '\n\n' + vinMileageGrid + '\n\n        ';
    content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    
    // Also change the validation rules to remove !modelYear if it's not visible
    content = content.replace(/!vehicleModel \|\| !modelYear/g, '!vehicleModel');
    content = content.replace(/Vehicle Model, Model Year,/g, 'Vehicle Model,');
    content = content.replace(/vehicleModel && modelYear/g, 'vehicleModel');
    
    fs.writeFileSync(file, content);
    console.log('Successfully patched HomeView.jsx via Node script');
} else {
    console.log('Failed to find start/end bounds. Start:', startIndex, 'End:', endIndex);
}
