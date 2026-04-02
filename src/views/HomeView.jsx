import React from 'react';
import { Car, Calendar, Info, Layers, Cpu, Radio, MapPin, Package, AlertCircle, ArrowRight, Clock, ChevronRight, Globe, User, Image as ImageIcon, Map as MapIcon, Database, Activity, Bug } from 'lucide-react';
import { FIELD_LABELS } from '../constants/labels.js';
import { ARCHITECTURES, IVI_MODULES, COMM_MODULES } from '../constants.js';
import { decodeModelYearFromVin } from '../utils/vinDecoder.js';

export default function HomeView({
  vehicleModel, setVehicleModel,
  modelYear, setModelYear,
  vin, setVin,
  tester, setTester,
  mileage, setMileage,
  address, setAddress,
  architecture, setArchitecture,
  iviModule, setIviModule,
  commModule, setCommModule,
  packagePhoto, envPhoto,
  handleAddMedia,
  setToast,
  setView,
  resetAllFields,
  setHistorySessions,
  API_BASE,
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans p-4 sm:p-8 overflow-y-auto selection:bg-blue-500">
      <header className="mb-8 flex justify-between items-center animate-in fade-in slide-in-from-top duration-500">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase flex items-center gap-2">
            Vehicle<span className="text-blue-500">Lab</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{FIELD_LABELS.validationTest}</p>
        </div>
        <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
          <Car className="text-blue-500" size={28} />
        </div>
      </header>

      <div className="space-y-6 max-w-md mx-auto w-full pb-12">
        {/* Vehicle Info Card */}
        <section className="automotive-card p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-subheader">{FIELD_LABELS.vehicleModel}</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value.toUpperCase())}
                placeholder={FIELD_LABELS.placeholderVehicle}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl h-9 px-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all uppercase placeholder:text-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-subheader">{FIELD_LABELS.modelYear}</label>
              <input
                type="text"
                value={modelYear}
                onChange={(e) => setModelYear(e.target.value)}
                placeholder={FIELD_LABELS.placeholderYear}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl h-9 px-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-subheader">{FIELD_LABELS.vin}</label>
            <input
              type="text"
              value={vin}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setVin(val.slice(0, 17));
                const decodedYear = decodeModelYearFromVin(val);
                if (decodedYear) setModelYear(decodedYear);
              }}
              placeholder={FIELD_LABELS.placeholderVin}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl h-9 px-3 text-sm font-black text-blue-400 focus:outline-none focus:border-blue-500 transition-all uppercase placeholder:text-slate-700 tracking-wider"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-subheader">{FIELD_LABELS.tester}</label>
              <input
                type="text"
                value={tester}
                onChange={(e) => setTester(e.target.value)}
                placeholder={FIELD_LABELS.placeholderTester}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl h-9 px-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-subheader">{FIELD_LABELS.mileage}</label>
              <input
                type="text"
                inputMode="numeric"
                value={mileage}
                onChange={(e) => setMileage(e.target.value.replace(/\D/g, ''))}
                placeholder={FIELD_LABELS.placeholderMileage}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl h-9 px-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-subheader">{FIELD_LABELS.address}</label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={FIELD_LABELS.enterLocation}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl h-9 px-3 pr-10 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
              />
              <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
            </div>
          </div>
        </section>

        {/* System Config Card */}
        <section className="automotive-card p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-subheader">{FIELD_LABELS.architecture}</label>
            <div className="relative">
              <select
                value={architecture}
                onChange={(e) => setArchitecture(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl h-9 px-3 text-[11px] font-bold text-gray-500 appearance-none focus:outline-none focus:border-blue-500"
              >
                <option value="">-- SELECT --</option>
                {ARCHITECTURES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-subheader">{FIELD_LABELS.iviModule}</label>
              <div className="relative">
                <select
                  value={iviModule}
                  onChange={(e) => setIviModule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl h-9 px-3 pr-8 text-[11px] font-bold text-gray-500 appearance-none focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- SELECT --</option>
                  {IVI_MODULES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <ChevronRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-subheader">{FIELD_LABELS.commModule}</label>
              <div className="relative">
                <select
                  value={commModule}
                  onChange={(e) => setCommModule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl h-9 px-3 pr-8 text-[11px] font-bold text-gray-500 appearance-none focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- SELECT --</option>
                  {COMM_MODULES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <ChevronRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Media Evidence */}
        <section className="flex justify-center gap-8 py-2">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleAddMedia('package')}
              className={`w-20 h-20 rounded-2xl bg-slate-900 border-2 transition-all active:scale-95 flex items-center justify-center relative overflow-hidden group ${packagePhoto ? 'border-blue-500' : 'border-slate-800'}`}
            >
              <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-all" />
              {packagePhoto ? <img src={packagePhoto} className="w-full h-full object-cover" alt="package" /> : <Package size={28} className="text-slate-700" />}
            </button>
            <span className="text-[10px] font-black text-slate-500 uppercase">{FIELD_LABELS.packagePhoto}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleAddMedia('env')}
              className={`w-20 h-20 rounded-2xl bg-slate-900 border-2 transition-all active:scale-95 flex items-center justify-center relative overflow-hidden group ${envPhoto ? 'border-blue-500' : 'border-slate-800'}`}
            >
              <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-all" />
              {envPhoto ? <img src={envPhoto} className="w-full h-full object-cover" alt="env" /> : <ImageIcon size={28} className="text-slate-700" />}
            </button>
            <span className="text-[10px] font-black text-slate-500 uppercase">{FIELD_LABELS.envPhoto}</span>
          </div>
        </section>

        {/* Data Validation Alert */}
        {(!vehicleModel || !vin || !tester || !mileage) && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest">
            <Info size={16} className="shrink-0" />
            <span>{`请填写 ${FIELD_LABELS.vehicleModel.split(' / ')[0]}, ${FIELD_LABELS.vin.split(' / ')[0]}, ${FIELD_LABELS.tester?.split(' / ')[0] || 'Tester'}, ${FIELD_LABELS.mileage?.split(' / ')[0] || 'Mileage'} 后再继续。`} <br></br> {`Please fill in ${FIELD_LABELS.vehicleModel.split(' / ')[1]}, ${FIELD_LABELS.vin.split(' / ')[1]}, ${FIELD_LABELS.tester?.split(' / ')[1] || 'Tester'}, ${FIELD_LABELS.mileage?.split(' / ')[1] || 'Mileage'} before proceeding.`}</span>
          </div>
        )}

        {/* Command Actions */}
        <div className="space-y-4 pt-2">
          <button
            onClick={() => setView('test')}
            disabled={!vehicleModel || !vin || !tester || !mileage}
            className={`w-full automotive-btn flex items-center justify-center gap-4 group ${!vehicleModel || !vin || !tester || !mileage ? 'opacity-30 cursor-not-allowed filter grayscale' : ''
              }`}
          >
            {FIELD_LABELS.executeTesting}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                fetch(`${API_BASE}/test-sessions`)
                  .then(res => res.json())
                  .then(data => setHistorySessions(data))
                  .catch(err => console.error('Failed to fetch history:', err));
                setView('history');
              }}
              className="automotive-btn-outline flex items-center justify-center gap-3 text-[11px] py-4"
            >
              <Database size={16} /> TEST HISTORY
            </button>
            <button
              onClick={() => setView('admin')}
              className="automotive-btn-outline flex items-center justify-center gap-3 text-[11px] py-4"
            >
              <MapIcon size={16} /> CASE MANAGEMENT
            </button>
            <button
              onClick={() => setView('dashboard')}
              className="col-span-2 automotive-btn-outline border-blue-500/30 text-blue-400 hover:bg-blue-600/10 hover:border-blue-400 flex items-center justify-center gap-3 text-[11px] py-4 transition-all"
            >
              <Activity size={16} /> MANAGER DASHBOARD
            </button>
            <button
              onClick={() => setView('pdca')}
              className="col-span-2 automotive-btn-outline border-amber-500/30 text-amber-500 hover:bg-amber-600/10 hover:border-amber-400 flex items-center justify-center gap-3 text-[11px] py-4 transition-all"
            >
              <Bug size={16} /> PDCA DEFECT CENTER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
