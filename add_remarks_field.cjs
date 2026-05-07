const fs = require('fs');

function addRemarksField() {
  console.log("Updating App.jsx...");
  let appStr = fs.readFileSync('src/App.jsx', 'utf8');
  appStr = appStr.replace(/const \[mileage, setMileage\] = useState\(''\);/, "const [mileage, setMileage] = useState('');\n  const [remarks, setRemarks] = useState('');");
  appStr = appStr.replace(/setTester\(''\); setMileage\(''\);/, "setTester(''); setMileage(''); setRemarks('');");
  appStr = appStr.replace(/setMileage\(sess.mileage \|\| ''\);/, "setMileage(sess.mileage || '');\n    setRemarks(sess.remarks || '');");
  appStr = appStr.replace(/tester, mileage \}/, "tester, mileage, remarks }");
  appStr = appStr.replace(/mileage=\{mileage\} setMileage=\{setMileage\}/, "mileage={mileage} setMileage={setMileage}\n        remarks={remarks} setRemarks={setRemarks}");
  fs.writeFileSync('src/App.jsx', appStr, 'utf8');

  console.log("Updating HomeView.jsx...");
  let homeStr = fs.readFileSync('src/views/HomeView.jsx', 'utf8');
  homeStr = homeStr.replace(/mileage, setMileage,/, "mileage, setMileage,\n  remarks, setRemarks,");
  
  const homeRemarksUI = `
        {/* Row 11: 备注 */}
        <div className="bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent rounded-[16px] flex flex-col gap-[10px] pt-[10px] pb-[14px]">
          <div className="flex items-center px-[16px] gap-[14px]">
            <FileText size={26} className="text-slate-900 dark:text-white p-[2px]" strokeWidth={1.5} />
            <span className="text-[14px] font-[600] text-slate-500 dark:text-[#94a3b8]">备注</span>
          </div>
          <div className="px-[16px]">
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="请输入备注信息..."
              className="w-full h-[80px] bg-slate-50 dark:bg-[#1c1c1e] text-slate-900 dark:text-white rounded-[12px] p-[12px] text-[16px] placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none resize-none border border-slate-200 dark:border-[#2c2c2e]/50 focus:ring-1 focus:ring-[#3b82f6] transition-all"
            />
          </div>
        </div>
`;
  homeStr = homeStr.replace(/(<div className="bg-white dark:bg-\[#111827\] shadow-sm dark:shadow-none border border-slate-200\/60 dark:border-transparent rounded-\[16px\] flex flex-col gap-\[10px\] pt-\[10px\] pb-\[14px\]">\s*<div className="flex items-center justify-between px-\[16px\]">[\s\S]*?\{\/\* \-\-\- Buttons \-\-\- \*\/)/, homeRemarksUI + '\n        $1');
  if(!homeStr.includes('FileText')) {
     homeStr = homeStr.replace(/\} from 'lucide-react';/, ", FileText } from 'lucide-react';");
  }
  fs.writeFileSync('src/views/HomeView.jsx', homeStr, 'utf8');

  console.log("Updating EditSessionModal.jsx...");
  let modalStr = fs.readFileSync('src/components/EditSessionModal.jsx', 'utf8');
  modalStr = modalStr.replace(/mileage: session.mileage \|\| ''/, "mileage: session.mileage || '',\n    remarks: session.remarks || ''");
  
  const modalRemarksUI = `
          {/* 备注 */}
          <div className="flex flex-col gap-[8px] bg-white dark:bg-[#121826] p-[16px] border border-slate-200 dark:border-\[#1e293b\] rounded-[16px]">
            <div className="flex items-center gap-[6px]">
              <FileText size={16} className="text-slate-500 dark:text-[#94a3b8]" />
              <span className="text-[14px] font-[600] text-slate-500 dark:text-[#94a3b8]">备注</span>
            </div>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="请输入备注信息..."
              className="w-full h-[80px] bg-slate-50 dark:bg-[#1c1c1e] text-slate-900 dark:text-white text-[16px] rounded-[12px] p-[12px] outline-none resize-none border border-slate-200 dark:border-[#1e293b] focus:border-[#3b82f6] transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>
  modalStr = modalStr.replace('        </div>\\n\\n        {/* Footer Buttons */}', modalRemarksUI + '\\n        </div>\\n\\n        {/* Footer Buttons */}');
  if(!modalStr.includes('FileText')) {
     modalStr = modalStr.replace(/\} from 'lucide-react';/, ", FileText } from 'lucide-react';");
  }
  fs.writeFileSync('src/components/EditSessionModal.jsx', modalStr, 'utf8');

  console.log("Updating server/db.cjs...");
  let dbStr = fs.readFileSync('server/db.cjs', 'utf8');
  dbStr = dbStr.replace(/await addColumn\('mileage', "VARCHAR\(255\) DEFAULT ''"\);/, "await addColumn('mileage', \"VARCHAR(255) DEFAULT ''\");\n            await addColumn('remarks', \"TEXT\");");
  fs.writeFileSync('server/db.cjs', dbStr, 'utf8');

  console.log("Updating server/routes/sessions.cjs...");
  let routesStr = fs.readFileSync('server/routes/sessions.cjs', 'utf8');
  // POST
  routesStr = routesStr.replace(/env_photo, tester, mileage, timestamp/, "env_photo, tester, mileage, remarks, timestamp");
  routesStr = routesStr.replace(/VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)/, "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  routesStr = routesStr.replace(/vehicle.mileage \|\| '',\n\s*getBeijingTime\(\)/, "vehicle.mileage || '',\n            vehicle.remarks || '',\n            getBeijingTime()");
  // PUT
  routesStr = routesStr.replace(/env_photo = \?, tester = \?, mileage = \?, timestamp = \?/, "env_photo = ?, tester = ?, mileage = ?, remarks = ?, timestamp = ?");
  routesStr = routesStr.replace(/vehicle.mileage \|\| '', getBeijingTime\(\), sessionId/, "vehicle.mileage || '', vehicle.remarks || '', getBeijingTime(), sessionId");
  // GET
  routesStr = routesStr.replace(/ts.env_photo, ts.tester, ts.mileage, ts.timestamp,/, "ts.env_photo, ts.tester, ts.mileage, ts.remarks, ts.timestamp,");
  fs.writeFileSync('server/routes/sessions.cjs', routesStr, 'utf8');

  console.log("Done.");
}

addRemarksField();
