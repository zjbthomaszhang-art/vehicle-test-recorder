import React, { useState, useRef } from 'react';
import { X, Pencil, MapPin, Layers, Cpu, Radio, Package, Car, Info } from 'lucide-react';

import { ARCHITECTURES, IVI_MODULES, COMM_MODULES } from '../constants.js';

/**
 * Modal for editing historical session metadata (address, arch, IVI/Comm modules, photos).
 */
export default function EditSessionModal({ session, onClose, onSave }) {
  const [formData, setFormData] = useState({
    vehicleModel: session.vehicle_model || '',
    model_year: session.model_year || '',
    vin: session.vin || '',
    address: session.address || '',
    architecture: session.architecture || '',
    iviModule: session.ivi_module || '',
    commModule: session.comm_module || '',
    packagePhoto: session.package_photo || null,
    envPhoto: session.env_photo || null,
    tester: session.tester || '',
    mileage: session.mileage || ''
  });

  const photoInputRef = useRef(null);
  const [activeTarget, setActiveTarget] = useState(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (activeTarget === 'package') setFormData(prev => ({ ...prev, packagePhoto: reader.result }));
        else if (activeTarget === 'env') setFormData(prev => ({ ...prev, envPhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPhoto = (target) => {
    setActiveTarget(target);
    photoInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
          <div>
            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
              <Pencil size={20} className="text-blue-500" /> Edit Session Record
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">ID: #{session.id} • Metadata Management</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                  <MapPin size={14} className="text-blue-500" /> Address
                </label>
                <input
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-blue-500 outline-none transition-all shadow-inner"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                  <Layers size={14} className="text-blue-500" /> Architecture
                </label>
                <select
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-blue-500 outline-none transition-all appearance-none"
                  value={formData.architecture}
                  onChange={e => setFormData(prev => ({ ...prev, architecture: e.target.value }))}
                >
                  <option value="">-- Select --</option>
                  {ARCHITECTURES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                  <Cpu size={14} className="text-blue-500" /> IVI Module
                </label>
                <select
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-blue-500 outline-none transition-all appearance-none"
                  value={formData.iviModule}
                  onChange={e => setFormData(prev => ({ ...prev, iviModule: e.target.value }))}
                >
                  <option value="">-- Select --</option>
                  {IVI_MODULES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                  <Radio size={14} className="text-blue-500" /> Comm Module
                </label>
                <select
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-blue-500 outline-none transition-all appearance-none"
                  value={formData.commModule}
                  onChange={e => setFormData(prev => ({ ...prev, commModule: e.target.value }))}
                >
                  <option value="">-- Select --</option>
                  {COMM_MODULES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Car size={14} className="text-blue-500" /> Tester
              </label>
              <input
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-blue-500 outline-none transition-all shadow-inner"
                value={formData.tester}
                onChange={e => setFormData(prev => ({ ...prev, tester: e.target.value }))}
                placeholder="Tester name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Info size={14} className="text-blue-500" /> Total Mileage
              </label>
              <input
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-blue-500 outline-none transition-all shadow-inner"
                value={formData.mileage}
                onChange={e => setFormData(prev => ({ ...prev, mileage: e.target.value.replace(/\D/g, '') }))}
                placeholder="e.g. 12000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Package Photo</label>
              <button
                onClick={() => handleAddPhoto('package')}
                className="w-full aspect-video bg-slate-950/50 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center group hover:bg-slate-950 transition-all overflow-hidden"
              >
                {formData.packagePhoto ? (
                  <img src={formData.packagePhoto} className="w-full h-full object-cover" alt="package" />
                ) : (
                  <>
                    <Package size={20} className="text-slate-700 group-hover:text-blue-500/50 transition-all mb-2" />
                    <span className="text-[9px] font-black text-slate-700 uppercase">Update Photo</span>
                  </>
                )}
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Env Photo</label>
              <button
                onClick={() => handleAddPhoto('env')}
                className="w-full aspect-video bg-slate-950/50 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center group hover:bg-slate-950 transition-all overflow-hidden"
              >
                {formData.envPhoto ? (
                  <img src={formData.envPhoto} className="w-full h-full object-cover" alt="env" />
                ) : (
                  <>
                    <MapPin size={20} className="text-slate-700 group-hover:text-blue-500/50 transition-all mb-2" />
                    <span className="text-[9px] font-black text-slate-700 uppercase">Update Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-950/50 border-t border-white/5 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl border border-white/5 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 py-4 bg-blue-600 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all"
          >
            Save Changes
          </button>
        </div>
        <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
      </div>
    </div>
  );
}
