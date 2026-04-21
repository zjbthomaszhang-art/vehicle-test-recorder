import React, { useState, useRef } from 'react';
import { X, Code, Calendar, Car, User, Gauge, MapPin, Network, Music, Radio, Camera, Save, Trash2, Image as ImageIcon, CameraIcon, Layers, Monitor } from 'lucide-react';
import CustomSelect from './CustomSelect.jsx';
import { ARCHITECTURES, IVI_MODULES, COMM_MODULES } from '../constants.js';
import { decodeModelYearFromVin } from '../utils/vinDecoder.js';
import { uploadPhoto } from '../utils/photoUpload.js';

// Row wrapper — matches HomeView row style exactly
function FieldRow({ children, tall }) {
  return (
    <div className={`bg-[#1e293b]/50 border border-[#334155]/60 rounded-[16px] px-[16px] flex items-center justify-between group focus-within:border-[#3b82f6] transition-all ${tall ? 'py-[10px]' : 'h-[54px]'}`}>
      {children}
    </div>
  );
}

// Left label block
function FieldLabel({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-[14px] shrink-0">
      <Icon size={32} className="text-[#8e8e93] p-1" strokeWidth={1.5} />
      <span className="text-[16px] font-[600] text-slate-100">{label}</span>
    </div>
  );
}

const inputCls = 'bg-transparent text-right outline-none text-slate-200 font-semibold text-[15px] w-1/2 placeholder:text-slate-600 placeholder:font-normal';
const selectCls = 'bg-transparent text-right outline-none text-slate-200 font-semibold text-[15px] w-1/2 appearance-none cursor-pointer';

export default function EditSessionModal({ session, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    vehicleModel: session.vehicle_model || '',
    model_year:   session.model_year || '',
    vin:          session.vin || '',
    productionStage: session.production_stage || '',
    testEnv:      session.test_env || '',
    address:      session.address || session.test_location || '',
    architecture: session.architecture || session.vehicle_architecture || '',
    iviModule:    session.ivi_module || '',
    commModule:   session.comm_module || '',
    envPhotos:    (() => {
      const raw = session.env_photo ?? session.env_photos;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
    })(),
    tester:       session.tester || '',
    mileage:      session.mileage || '',
  });

  const photoInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const url = await uploadPhoto(file);
    if (url) setFormData(prev => ({ ...prev, envPhotos: [...(prev.envPhotos || []), url] }));
  };

  const set = (key, transform) => (e) => {
    const val = transform ? transform(e.target.value) : e.target.value;
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#0f1523] flex flex-col animate-in fade-in duration-200">

        {/* Header — matches HomeView header padding */}
        <div className="px-[24px] pt-[44px] pb-[16px] shrink-0">
          <h2 className="text-[26px] font-[800] text-[#f8fafc]">编辑测试记录</h2>
        </div>

        {/* Scrollable Fields */}
        <div className="flex-1 overflow-y-auto px-[16px] pt-[8px] pb-[16px] flex flex-col gap-[8px] edit-modal-scroll">

          {/* 生产年份 — digits only */}
          <FieldRow>
            <FieldLabel icon={Calendar} label="生产年份" />
            <input
              type="text"
              inputMode="numeric"
              value={formData.model_year}
              onChange={set('model_year', v => v.replace(/\D/g, ''))}
              className={inputCls}
            />
          </FieldRow>

          {/* 工程代码 — uppercase */}
          <FieldRow>
            <FieldLabel icon={Code} label="工程代码" />
            <input
              type="text"
              value={formData.vehicleModel}
              onChange={set('vehicleModel', v => v.toUpperCase())}
              className={`${inputCls} uppercase`}
            />
          </FieldRow>

          {/* VIN — uppercase, max 17, auto-decode year */}
          <FieldRow>
            <FieldLabel icon={Car} label="VIN" />
            <input
              type="text"
              value={formData.vin}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().slice(0, 17);
                const decodedYear = decodeModelYearFromVin(val);
                setFormData(prev => ({
                  ...prev,
                  vin: val,
                  ...(decodedYear ? { model_year: decodedYear } : {})
                }));
              }}
              className={`${inputCls} w-full ml-4 uppercase`}
            />
          </FieldRow>

          {/* 生产阶段 */}
          <FieldRow>
            <FieldLabel icon={Layers} label="生产阶段" />
            <CustomSelect
              value={formData.productionStage}
              onChange={(val) => setFormData(prev => ({ ...prev, productionStage: val }))}
              options={['PPV', 'NS', 'VDC', 'S', 'STC']}
              placeholder="选择"
              align="right"
              className="w-1/2"
            />
          </FieldRow>

          {/* 总里程数 — digits only + km suffix */}
          <FieldRow>
            <FieldLabel icon={Gauge} label="总里程数" />
            <div className="flex items-center justify-end gap-[4px] w-1/2">
              <input
                type="text"
                inputMode="numeric"
                value={formData.mileage}
                onChange={set('mileage', v => v.replace(/\D/g, ''))}
                className="bg-transparent text-right outline-none text-slate-200 font-semibold text-[15px] min-w-0 placeholder:text-slate-600"
              />
              {formData.mileage && <span className="text-[#64748b] text-[13px] font-[500] shrink-0">km</span>}
            </div>
          </FieldRow>

          {/* 测试环境 */}
          <FieldRow>
            <FieldLabel icon={Monitor} label="测试环境" />
            <CustomSelect
              value={formData.testEnv}
              onChange={(val) => setFormData(prev => ({ ...prev, testEnv: val }))}
              options={['生产', '测试']}
              placeholder="选择"
              align="right"
              className="w-1/2"
            />
          </FieldRow>

          {/* 测试人员 */}
          <FieldRow>
            <FieldLabel icon={User} label="测试人员" />
            <input
              type="text"
              value={formData.tester}
              onChange={set('tester')}
              className={inputCls}
            />
          </FieldRow>

          {/* 测试地址 */}
          <FieldRow>
            <FieldLabel icon={MapPin} label="测试地址" />
            <input
              type="text"
              value={formData.address}
              onChange={set('address')}
              className={inputCls}
            />
          </FieldRow>

          {/* 总线架构 */}
          <FieldRow>
            <FieldLabel icon={Network} label="总线架构" />
            <CustomSelect
              value={formData.architecture}
              onChange={(val) => setFormData(prev => ({ ...prev, architecture: val }))}
              options={ARCHITECTURES}
              placeholder="选择"
              align="right"
              className="w-1/2"
            />
          </FieldRow>

          {/* 娱乐系统 */}
          <FieldRow>
            <FieldLabel icon={Music} label="娱乐系统" />
            <CustomSelect
              value={formData.iviModule}
              onChange={(val) => setFormData(prev => ({ ...prev, iviModule: val }))}
              options={IVI_MODULES}
              placeholder="选择"
              align="right"
              className="w-1/2"
            />
          </FieldRow>

          {/* 通讯模块 */}
          <FieldRow>
            <FieldLabel icon={Radio} label="通讯模块" />
            <CustomSelect
              value={formData.commModule}
              onChange={(val) => setFormData(prev => ({ ...prev, commModule: val }))}
              options={COMM_MODULES}
              placeholder="选择"
              align="right"
              className="w-1/2"
            />
          </FieldRow>

          {/* 现场环境照片 — matches HomeView photo row exactly */}
          <div className="bg-[#1e293b]/50 border border-[#334155]/60 rounded-[16px] flex flex-col gap-[10px] pt-[10px] pb-[14px]">
            <div className="flex items-center justify-between px-[16px]">
              <div className="flex items-center gap-[14px] shrink-0">
                <Camera size={32} className="text-[#8e8e93] p-1" strokeWidth={1.5} />
                <span className="text-[16px] font-[600] text-slate-100">现场环境照片</span>
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="w-[32px] h-[32px] rounded-md border border-[#3c3c43] bg-[#1c1c1e] flex items-center justify-center hover:bg-[#2c2c2e] transition-colors active:scale-95"
              >
                <CameraIcon size={18} className="text-[#8e8e93]" strokeWidth={2} />
              </button>
            </div>

            {formData.envPhotos && formData.envPhotos.length > 0 && (
              <div className="flex gap-[8px] pl-[62px] pr-[16px] overflow-x-auto pt-[2px] pb-[8px]">
                {formData.envPhotos.map((photo, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-[4px] flex-shrink-0">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, envPhotos: prev.envPhotos.filter((_, i) => i !== idx) }))}
                      className="w-[16px] h-[16px] rounded-full bg-[#ef4444] flex items-center justify-center"
                    >
                      <X size={10} className="text-white" strokeWidth={3} />
                    </button>
                    <div className="w-[48px] h-[40px] rounded-md bg-[#1c1c1e] overflow-hidden border border-[#2c2c2e]/50">
                      <img src={photo} className="w-full h-full object-cover" alt={`env ${idx}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="flex items-center gap-[8px] px-[16px] py-[16px] pb-[40px] shrink-0 border-t border-[#1e293b]">
          <button
            onClick={onClose}
            className="flex flex-col items-center justify-center gap-[4px] w-[72px] h-[56px] rounded-[16px] text-[#64748b] hover:bg-[#1e293b] transition-colors shrink-0"
          >
            <X size={16} />
            <span className="text-[11px] font-[800]">取消</span>
          </button>

          <button
            onClick={() => onSave(formData)}
            className="flex-1 h-[56px] bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 transition-all rounded-[16px] flex items-center justify-center gap-[8px] shadow-lg shadow-blue-600/20"
          >
            <Save size={16} className="text-white" />
            <span className="text-[14px] font-[900] text-white">保存修改</span>
          </button>

          <button
            onClick={() => onDelete && onDelete(session.id)}
            className="flex flex-col items-center justify-center gap-[4px] w-[72px] h-[56px] rounded-[16px] text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors shrink-0"
          >
            <Trash2 size={16} />
            <span className="text-[11px] font-[800]">删除记录</span>
          </button>
        </div>

        <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />

        <style>{`
          .edit-modal-scroll::-webkit-scrollbar { width: 4px; }
          .edit-modal-scroll::-webkit-scrollbar-track { background: transparent; }
          .edit-modal-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
          .edit-modal-scroll::-webkit-scrollbar-thumb:hover { background: #475569; }
          .edit-modal-scroll { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
        `}</style>
    </div>
  );
}
