import React from 'react';
import { Car, Calendar, Info, Layers, Radio, MapPin, ArrowRight, User, Map as MapIcon, Database, Activity, Bug, Code, Gauge, Monitor, Network, Music, ChevronDown, X, Camera, CameraIcon } from 'lucide-react';
import { FIELD_LABELS } from '../constants/labels.js';
import { ARCHITECTURES, IVI_MODULES, COMM_MODULES } from '../constants.js';
import { decodeModelYearFromVin } from '../utils/vinDecoder.js';
import CustomSelect from '../components/CustomSelect.jsx';

export default function HomeView({
  vehicleModel, setVehicleModel,
  modelYear, setModelYear,
  vin, setVin,
  productionStage, setProductionStage,
  testEnv, setTestEnv,
  tester, setTester,
  mileage, setMileage,
  address, setAddress,
  architecture, setArchitecture,
  iviModule, setIviModule,
  commModule, setCommModule,
  envPhotos, setEnvPhotos,
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
          <div className="relative inline-block pb-[4px] w-fit overflow-hidden">
            <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase whitespace-nowrap relative z-10 px-[4px]">
              {['V','E','H','I','C','L','E'].map((char, i) => (
                <span key={`v-${i}`} className="animate-cyber-letter" style={{ animationDelay: `${i * 0.05}s` }}>{char}</span>
              ))}
              <span className="inline-block relative pr-2 pb-1 top-[2px] text-[1.25em] ml-[0.3em]">
                {['L','A','B'].map((char, i) => (
                  <span key={`l-${i}`} className="animate-cyber-letter bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent pr-[0.3em] -mr-[0.3em] pb-[0.2em] -mb-[0.2em]" style={{ animationDelay: `${(7 + i) * 0.05}s` }}>{char}</span>
                ))}
              </span>
            </h1>
            <div className="scanline-overlay rounded-[4px]"></div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{FIELD_LABELS.validationTest}</p>
        </div>
        <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
          <Car className="text-blue-500" size={28} />
        </div>
      </header>

      {/* Scrolling Form Container */}
      <div className="px-0 pt-[4px] space-y-[8px] w-full max-w-lg mx-auto pb-12">
        
        {/* Group 1: 生产年份 & 工程代码 */}
        <div className="flex gap-[8px] w-full">
          <div className="flex-[46] bg-[#111827] rounded-[16px] h-[54px] px-[16px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">
            <div className="flex items-center gap-[8px] sm:gap-[14px] shrink-0">
              <Calendar size={26} className="text-[#8e8e93] p-[2px] shrink-0" strokeWidth={1.5} />
              <span className="text-[13px] sm:text-[14px] font-[600] text-slate-100 whitespace-nowrap">生产年份</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={modelYear}
              onChange={(e) => setModelYear(e.target.value.replace(/\D/g, ''))}
              placeholder=""
              className="bg-transparent text-right outline-none text-slate-200 font-semibold text-[13px] sm:text-[14px] flex-1 min-w-0 ml-2 placeholder:text-slate-600 placeholder:font-normal"
            />
          </div>

          <div className="flex-[54] bg-[#111827] rounded-[16px] h-[54px] px-[16px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">
            <div className="flex items-center gap-[8px] sm:gap-[14px] shrink-0">
              <Code size={26} className="text-[#8e8e93] p-[2px] shrink-0" strokeWidth={1.5} />
              <span className="text-[13px] sm:text-[14px] font-[600] text-slate-100 whitespace-nowrap">工程代码</span>
            </div>
            <input
              type="text"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value.toUpperCase())}
              placeholder=""
              className="bg-transparent text-right outline-none text-slate-200 font-semibold text-[13px] sm:text-[14px] flex-1 min-w-0 ml-2 placeholder:text-slate-600 placeholder:font-normal uppercase"
            />
          </div>
        </div>

        {/* Row 2: VIN */}
        <div className="bg-[#111827] rounded-[16px] h-[54px] px-[16px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all">
          <div className="flex items-center gap-[14px] shrink-0">
            <Car size={26} className="text-[#8e8e93] p-[2px]" strokeWidth={1.5} />
            <span className="text-[14px] font-[600] text-slate-100">VIN</span>
          </div>
          <input
            type="text"
            value={vin}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setVin(val.slice(0, 17));
              const decodedYear = decodeModelYearFromVin(val);
              if (decodedYear) setModelYear(decodedYear);
            }}
            placeholder=""
            className="bg-transparent text-right outline-none text-slate-200 font-semibold text-[14px] flex-1 min-w-0 ml-4 placeholder:text-slate-600 placeholder:font-normal uppercase"
          />
        </div>

        {/* Group 2: 生产阶段 & 总里程数 */}
        <div className="flex gap-[8px] w-full">
          <div className="flex-[46] bg-[#111827] rounded-[16px] h-[54px] px-[16px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">
            <div className="flex items-center gap-[8px] sm:gap-[14px] shrink-0">
              <Layers size={26} className="text-[#8e8e93] p-[2px] shrink-0" strokeWidth={1.5} />
              <span className="text-[13px] sm:text-[14px] font-[600] text-slate-100 whitespace-nowrap">生产阶段</span>
            </div>
            <div className="flex items-center justify-end gap-[4px] flex-1 min-w-0 ml-[2px]">
              <CustomSelect
                value={productionStage}
                onChange={setProductionStage}
                options={['PPV', 'NS', 'VDC', 'S', 'STC']}
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="flex-[54] bg-[#111827] rounded-[16px] h-[54px] px-[16px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">
            <div className="flex items-center gap-[8px] sm:gap-[14px] shrink-0">
              <Gauge size={26} className="text-[#8e8e93] p-[2px] shrink-0" strokeWidth={1.5} />
              <span className="text-[13px] sm:text-[14px] font-[600] text-slate-100 whitespace-nowrap">总里程数</span>
            </div>
            <div className="flex items-center justify-end gap-[4px] flex-1 min-w-0 ml-2">
              <input
                type="text"
                inputMode="numeric"
                value={mileage}
                onChange={(e) => setMileage(e.target.value.replace(/\D/g, ''))}
                placeholder=""
                className="bg-transparent text-right outline-none text-slate-200 font-semibold text-[13px] sm:text-[14px] min-w-0 flex-1 placeholder:text-slate-600 placeholder:font-normal"
              />
              {mileage && <span className="text-[#64748b] text-[12px] font-[500] shrink-0">km</span>}
            </div>
          </div>
        </div>

        {/* Group 3: 测试环境 & 测试人员 */}
        <div className="flex gap-[8px] w-full">
          <div className="flex-[46] bg-[#111827] rounded-[16px] h-[54px] px-[16px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">
            <div className="flex items-center gap-[8px] sm:gap-[14px] shrink-0">
              <Monitor size={26} className="text-[#8e8e93] p-[2px] shrink-0" strokeWidth={1.5} />
              <span className="text-[13px] sm:text-[14px] font-[600] text-slate-100 whitespace-nowrap">测试环境</span>
            </div>
            <div className="flex items-center justify-end gap-[4px] flex-1 min-w-0 ml-[2px]">
              <CustomSelect
                value={testEnv}
                onChange={setTestEnv}
                options={['生产', '测试']}
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="flex-[54] bg-[#111827] rounded-[16px] h-[54px] px-[16px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all min-w-0">
            <div className="flex items-center gap-[8px] sm:gap-[14px] shrink-0">
              <User size={26} className="text-[#8e8e93] p-[2px] shrink-0" strokeWidth={1.5} />
              <span className="text-[13px] sm:text-[14px] font-[600] text-slate-100 whitespace-nowrap">测试人员</span>
            </div>
            <input
              type="text"
              value={tester}
              onChange={(e) => setTester(e.target.value)}
              placeholder=""
              className="bg-transparent text-right outline-none text-slate-200 font-semibold text-[13px] sm:text-[14px] flex-1 min-w-0 ml-2 placeholder:text-slate-600 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Row 4: 测试地址 */}
        <div className="bg-[#111827] rounded-[16px] h-[54px] px-[16px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all">
          <div className="flex items-center gap-[14px] shrink-0">
            <MapPin size={26} className="text-[#8e8e93] p-[2px]" strokeWidth={1.5} />
            <span className="text-[14px] font-[600] text-slate-100">测试地址</span>
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder=""
            className="bg-transparent text-right outline-none text-slate-200 font-semibold text-[14px] flex-1 min-w-0 ml-4 placeholder:text-slate-600 placeholder:font-normal"
          />
        </div>

        {/* Row 7: 总线架构 */}
        <div className="bg-[#111827] rounded-[16px] h-[54px] px-[16px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all">
          <div className="flex items-center gap-[14px] shrink-0">
            <Network size={26} className="text-[#8e8e93] p-[2px]" strokeWidth={1.5} />
            <span className="text-[14px] font-[600] text-slate-100">总线架构</span>
          </div>
          <div className="flex items-center justify-end gap-[4px] flex-1 min-w-0 ml-4">
            <CustomSelect
              value={architecture}
              onChange={setArchitecture}
              options={ARCHITECTURES}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Row 8: 娱乐系统 */}
        <div className="bg-[#111827] rounded-[16px] h-[54px] px-[16px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all">
          <div className="flex items-center gap-[14px] shrink-0">
            <Music size={26} className="text-[#8e8e93] p-[2px]" strokeWidth={1.5} />
            <span className="text-[14px] font-[600] text-slate-100">娱乐系统</span>
          </div>
          <div className="flex items-center justify-end gap-[4px] flex-1 min-w-0 ml-4">
            <CustomSelect
              value={iviModule}
              onChange={setIviModule}
              options={IVI_MODULES}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Row 9: 通讯模块 */}
        <div className="bg-[#111827] rounded-[16px] h-[54px] px-[16px] flex items-center justify-between group focus-within:ring-1 focus-within:ring-[#007AFF] transition-all">
          <div className="flex items-center gap-[14px] shrink-0">
            <Radio size={26} className="text-[#8e8e93] p-[2px]" strokeWidth={1.5} />
            <span className="text-[14px] font-[600] text-slate-100">通讯模块</span>
          </div>
          <div className="flex items-center justify-end gap-[4px] flex-1 min-w-0 ml-4">
            <CustomSelect
              value={commModule}
              onChange={setCommModule}
              options={COMM_MODULES}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Row 10: 现场环境照片 */}
        <div className="bg-[#111827] rounded-[16px] flex flex-col gap-[10px] pt-[10px] pb-[14px]">
          <div className="flex items-center justify-between px-[16px]">
            <div className="flex items-center gap-[14px] shrink-0">
              <Camera size={26} className="text-[#8e8e93] p-[2px]" strokeWidth={1.5} />
              <span className="text-[14px] font-[600] text-slate-100">现场环境照片</span>
            </div>
            <button 
              onClick={() => handleAddMedia('env')}
              className="w-[32px] h-[32px] rounded-md border border-[#3c3c43] bg-[#1c1c1e] flex items-center justify-center hover:bg-[#2c2c2e] transition-colors active:scale-95"
            >
              <CameraIcon size={18} className="text-[#8e8e93]" strokeWidth={2} />
            </button>
          </div>
          {envPhotos && envPhotos.length > 0 && (
            <div className="flex gap-[8px] pl-[62px] pr-[16px] overflow-x-auto pt-[2px] pb-[8px]">
              {envPhotos.map((photo, idx) => (
                <div key={idx} className="flex flex-col items-center gap-[4px] flex-shrink-0">
                  <button
                    onClick={() => setEnvPhotos(prev => prev.filter((_, i) => i !== idx))}
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

        {/* Data Validation Alert */}
        {(!vehicleModel || !vin || !tester || !mileage) && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest mt-4">
            <Info size={16} className="shrink-0" />
            <span>{`请填写 ${FIELD_LABELS.vehicleModel.split(' / ')[0]}, ${FIELD_LABELS.vin.split(' / ')[0]}, ${FIELD_LABELS.tester?.split(' / ')[0] || 'Tester'}, ${FIELD_LABELS.mileage?.split(' / ')[0] || 'Mileage'} 后再继续。`} <br></br> {`Please fill in ${FIELD_LABELS.vehicleModel.split(' / ')[1]}, ${FIELD_LABELS.vin.split(' / ')[1]}, ${FIELD_LABELS.tester?.split(' / ')[1] || 'Tester'}, ${FIELD_LABELS.mileage?.split(' / ')[1] || 'Mileage'} before proceeding.`}</span>
          </div>
        )}



      </div>
    </div>
  );
}
