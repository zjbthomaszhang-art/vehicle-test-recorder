import React, { useRef, useEffect, useState } from 'react';
import {
  Camera, Bug, ChevronLeft, ChevronRight, ChevronDown, Clock, CheckCircle2, XCircle,
  Menu, X, MinusCircle, Info, Database, FileText, Home, FastForward, BadgeCheck,
  Send, Link, Target
} from 'lucide-react';
import { formatTime } from '../utils/formatters.js';
import { FIELD_LABELS } from '../constants/labels.js';
import ImageLightbox from '../components/ImageLightbox.jsx';
import TargetIcon from '../assets/sfsc.png';

export default function TestView({
  cases, caseResults, bugs,
  currentCaseIndex, setCurrentCaseIndex,
  vehicleModel, modelYear, vin,
  updateCurrentResult, handleTimeClick,
  handleAddMedia, convertToBug,
  nextCase, prevCase, saveTemporarily,
  setConfirmDialog, setView, resetAllFields,
  setToast, isOnline, pendingSyncCount,
}) {
  const activeCase = cases[currentCaseIndex];
  const currentData = caseResults[currentCaseIndex];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBugList, setShowBugList] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  
  const allCategories = React.useMemo(() => {
    const cats = new Set();
    cases.forEach(c => {
      let cat = c.category || '未分类';
      const funcCat = c.function_category || c.functionCategory || '';
      if (cat === '手机应用' || cat === '手机APP') {
        if (funcCat.match(/iOS/i)) cat = '手机应用-iOS';
        else if (funcCat.match(/Android|安卓/i)) cat = '手机应用-Android';
      }
      cats.add(cat);
    });
    return Array.from(cats);
  }, [cases]);

  const [hiddenCategories, setHiddenCategories] = useState(new Set());
  const toggleFilter = (cat) => {
    setHiddenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        if (allCategories.length - next.size <= 1) return prev;
        next.add(cat);
      }
      return next;
    });
  };

  const activeCaseRef = useRef(null);

  useEffect(() => {
    if (isMenuOpen && activeCaseRef.current) {
      activeCaseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isMenuOpen]);

  // --- Swipe Detection ---
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 70;

  const validateTimeFields = () => {
    if (activeCase.type === 'query') {
      if (!currentData.appFeedbackTime) {
        setToast({ message: '请先记录 App 反馈时间', type: 'error' });
        return false;
      }
    } else if (activeCase.type === 'timing') {
      if (!activeCase.hideCarExec && !currentData.carExecTime) {
        setToast({ message: '请先记录车辆执行时间', type: 'error' });
        return false;
      }
      if (!currentData.appFeedbackTime) {
        setToast({ message: '请先记录 App 反馈时间', type: 'error' });
        return false;
      }
    }
    return true;
  };

  const handleNextClick = () => {
    if (validateTimeFields()) {
      nextCase();
    }
  };

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) handleNextClick();
    if (distance < -minSwipeDistance) prevCase();
  };

  if (!activeCase || !currentData) {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">{FIELD_LABELS.processingTelemetry}</div>;
  }

  return (
    <>
    {lightbox && (
      <ImageLightbox
        images={lightbox.images}
        index={lightbox.index}
        onClose={() => setLightbox(null)}
        onChange={(i) => setLightbox(prev => ({ ...prev, index: i }))}
      />
    )}
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] text-slate-800 dark:text-slate-200 flex flex-col font-sans overflow-hidden pt-[48px] relative pb-[100px]">
      
      {/* Header HD1 */}
      <header className="px-[24px] flex justify-between items-center w-full z-10 shrink-0">
        <div className="flex items-baseline gap-[0.25em]">
            <span className="text-[20px] font-black italic tracking-tighter uppercase text-slate-900 dark:text-[#f8fafc] select-none">VEHICLE</span>
            <span className="text-[25px] font-black italic tracking-tighter uppercase bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent select-none pr-[6px]">LAB</span>
          </div>
        <div className="flex gap-[12px] items-center">
          <div className="border border-[#1e3a8a] rounded-[12px] px-[8px] py-[4px] flex items-center justify-center">
            <span className="text-[9px] font-[800] text-[#60a5fa]">
              {`MY${modelYear || ''}${modelYear && vehicleModel ? ' ' : ''}${vehicleModel || ''}`  || 'MY-- --'}
            </span>
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="flex items-center justify-center">
            <Menu size={24} className="text-slate-500 dark:text-[#cbd5e1]" />
          </button>
        </div>
      </header>

      {/* System Bar sbarBoxD */}
      <div className="px-[24px] shrink-0 mt-[16px]">
        <div className={`inline-flex rounded-[16px] border px-[12px] py-[4px] gap-[8px] items-center ${isOnline ? 'bg-[#d1fae5]/10 border-[#059669]/30' : 'bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border-slate-200 dark:border-[#475569]'}`}>
           <div className={`w-[6px] h-[6px] rounded-[3px] ${isOnline ? 'bg-[#10b981]' : 'bg-[#64748b]'}`}></div>
           <span className={`text-[9px] font-[800] ${isOnline ? 'text-[#10b981]' : 'text-slate-500 dark:text-[#cbd5e1]'}`}>
             {isOnline ? (pendingSyncCount > 0 ? `数据同步中(${pendingSyncCount})` : '数据已同步') : '当前离线记录'}
           </span>
        </div>
      </div>

      <main 
        className="flex-1 px-[24px] pt-[24px] flex flex-col overflow-y-auto custom-scrollbar pb-[40px]"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Tags & Meta tagsD */}
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-[8px] items-center">
            <div className="bg-[#2563eb] rounded-[6px] px-[8px] py-[4px] flex items-center justify-center">
               <span className="text-[9px] font-[900] text-white">{activeCase.category || 'CASE'}</span>
            </div>
            {(activeCase.function_category || activeCase.functionCategory) && (
              <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-[6px] px-[8px] py-[4px] flex items-center justify-center">
                 <span className="text-[9px] font-[800] text-[#3b82f6]">{activeCase.function_category || activeCase.functionCategory}</span>
              </div>
            )}
          </div>
          <span className="text-[12px] font-[800] text-[#64748b]">进度 {currentCaseIndex + 1} / {cases.length}</span>
        </div>

        {/* Title */}
        <h2 className="text-[20px] font-[900] text-slate-900 dark:text-[#f8fafc] mt-[16px]">{activeCase.function}</h2>
        {/* Expected result */}
        <div className="flex items-center gap-[6px] mt-[8px]">
          <div 
            className="w-[24px] h-[24px] shrink-0 bg-slate-500 dark:bg-[#cbd5e1]"
            style={{
              WebkitMaskImage: `url(${TargetIcon})`,
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskImage: `url(${TargetIcon})`,
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center'
            }}
          />
          <p className="text-[14px] font-[600] text-slate-500 dark:text-[#cbd5e1]">{activeCase.expected || FIELD_LABELS.noExpectedCriteria}</p>
        </div>

        {/* Test steps / method in blue info box */}
        {activeCase.hint && (
          <div className="mt-[12px] w-full rounded-[10px] bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] py-[8px] px-[12px] flex items-center gap-[8px]">
            <Info size={14} className="text-[#3b82f6] shrink-0" />
            <span className="text-[10px] font-[500] text-slate-700 dark:text-[#cbd5e1] leading-snug break-words whitespace-pre-wrap">{activeCase.hint}</span>
          </div>
        )}

        {/* Timing Header tTitleD */}
        <div className="mt-[24px] flex items-center gap-[8px]">
          <Clock size={14} className="text-[#64748b]" />
          <span className="text-[10px] font-[800] text-slate-500 dark:text-[#cbd5e1]">时间捕获</span>
        </div>

        {/* Timing Content tRwd */}
        <div className={`mt-[16px] w-full flex ${(activeCase.type === 'Simple' || activeCase.type === 'simple') ? 'justify-center' : 'justify-around'}`}>
          {/* Block 01 */}
           <button onClick={() => handleTimeClick('start')} className="flex flex-col items-center gap-[6px] active:scale-95">
             <div className={`w-[40px] h-[40px] rounded-[20px] flex items-center justify-center ${currentData.startTime ? 'bg-[#2563eb]' : 'bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none'}`}>
                <span className={`text-[14px] font-[900] ${currentData.startTime ? 'text-white' : 'text-[#64748b]'}`}>01</span>
             </div>
             <span className="text-[10px] font-[800] text-[#64748b]">开始</span>
             <span className={`text-[12px] font-[800] ${currentData.startTime ? 'text-[#3b82f6]' : 'text-[#1e293b]'}`}>
               {currentData.startTime ? formatTime(currentData.startTime) : '--:--:--'}
             </span>
           </button>

          {/* Block 02 */}
          {!activeCase.hideCarExec && activeCase.type === 'timing' && (
             <button onClick={() => handleTimeClick('car')} className="flex flex-col items-center gap-[6px] active:scale-95">
               <div className={`w-[40px] h-[40px] rounded-[20px] flex items-center justify-center ${currentData.carExecTime ? 'bg-[#d97706]' : 'bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none'}`}>
                  <span className={`text-[14px] font-[900] ${currentData.carExecTime ? 'text-white' : 'text-[#64748b]'}`}>02</span>
               </div>
               <span className="text-[10px] font-[800] text-[#64748b]">车辆执行</span>
               <span className={`text-[12px] font-[800] ${currentData.carExecTime ? 'text-[#f59e0b]' : 'text-[#1e293b]'}`}>
                 {currentData.carExecTime ? formatTime(currentData.carExecTime) : '--:--:--'}
               </span>
             </button>
          )}

          {/* Block 03 */}
          {(activeCase.type === 'timing' || activeCase.type === 'query') && (
            <button onClick={() => handleTimeClick('app')} className="flex flex-col items-center gap-[6px] active:scale-95">
              <div className={`w-[40px] h-[40px] rounded-[20px] flex items-center justify-center ${currentData.appFeedbackTime ? 'bg-[#10b981]' : 'bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none'}`}>
                 <span className={`text-[14px] font-[900] ${currentData.appFeedbackTime ? 'text-white' : 'text-[#64748b]'}`}>
                   {(activeCase.hideCarExec || activeCase.type === 'query') ? '02' : '03'}
                 </span>
              </div>
              <span className="text-[10px] font-[800] text-[#64748b]">App反馈</span>
              <span className={`text-[12px] font-[800] ${currentData.appFeedbackTime ? 'text-[#34d399]' : 'text-[#1e293b]'}`}>
                {currentData.appFeedbackTime ? formatTime(currentData.appFeedbackTime) : '--:--:--'}
              </span>
            </button>
          )}
        </div>

        {/* Duration row dR - timing shows both, query shows only App耗时 */}
        {(activeCase.type === 'timing' || activeCase.type === 'query') && (
        <div className="mt-[16px] w-full flex gap-[12px]">
          {activeCase.type === 'timing' && (
          <div className="flex-1 h-[72px] rounded-[12px] border border-slate-200 dark:border-[#334155] py-[12px] px-[16px] flex flex-col justify-between">
             <span className="text-[9px] font-[800] text-[#64748b]">车辆耗时</span>
             <span className="text-[18px] font-[900] text-slate-900 dark:text-[#f8fafc]">
               {(currentData.startTime && currentData.carExecTime) ? ((currentData.carExecTime - currentData.startTime) / 1000).toFixed(2) + 's' : '--'}
             </span>
          </div>
          )}
          <div className="flex-1 h-[72px] rounded-[12px] border border-slate-200 dark:border-[#334155] py-[12px] px-[16px] flex flex-col justify-between">
             <span className="text-[9px] font-[800] text-[#64748b]">App 耗时</span>
             <span className="text-[18px] font-[900] bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent">
               {(currentData.startTime && currentData.appFeedbackTime) ? ((currentData.appFeedbackTime - currentData.startTime) / 1000).toFixed(2) + 's' : '--'}
             </span>
          </div>
        </div>
        )}

        {/* Result Judgement Header vTitleD */}
        <div className="mt-[24px] flex items-center gap-[8px]">
          <BadgeCheck size={14} className="text-[#64748b]" />
          <span className="text-[10px] font-[800] text-slate-500 dark:text-[#cbd5e1]">结果判定</span>
        </div>

        {/* Buttons vRowD */}
        <div className="mt-[16px] w-full flex justify-between items-center gap-[12px]">
          <button onClick={() => updateCurrentResult({ result: 'Pass', ...(!currentData.startTime ? { startTime: Date.now() } : {}) })} className={`flex-1 h-[64px] rounded-[16px] flex flex-col justify-center items-center gap-[4px] border ${currentData.result === 'Pass' ? 'border-[#10b981]' : 'border-slate-200 dark:border-[#334155]'} bg-transparent transition-all active:scale-95`}>
            <CheckCircle2 size={20} className={currentData.result === 'Pass' ? 'text-[#10b981]' : 'text-[#64748b]'} />
            <span className={`text-[11px] font-[900] ${currentData.result === 'Pass' ? 'text-[#10b981]' : 'text-[#64748b]'}`}>通过</span>
          </button>
          <button onClick={() => updateCurrentResult({ result: 'Fail', ...(!currentData.startTime ? { startTime: Date.now() } : {}) })} className={`flex-1 h-[64px] rounded-[16px] flex flex-col justify-center items-center gap-[4px] border ${currentData.result === 'Fail' ? 'border-[#ef4444]' : 'border-slate-200 dark:border-[#334155]'} bg-transparent transition-all active:scale-95`}>
             <XCircle size={20} className={currentData.result === 'Fail' ? 'text-[#ef4444]' : 'text-[#64748b]'} />
             <span className={`text-[11px] font-[900] ${currentData.result === 'Fail' ? 'text-[#ef4444]' : 'text-[#64748b]'}`}>未通过</span>
          </button>
          <button onClick={() => updateCurrentResult({ result: 'N/A', ...(!currentData.startTime ? { startTime: Date.now() } : {}) })} className={`flex-1 h-[64px] rounded-[16px] flex flex-col justify-center items-center gap-[4px] border ${currentData.result === 'N/A' ? 'border-[#94a3b8]' : 'border-slate-200 dark:border-[#334155]'} bg-transparent transition-all active:scale-95`}>
            <MinusCircle size={20} className={currentData.result === 'N/A' ? 'text-slate-500 dark:text-[#cbd5e1]' : 'text-[#64748b]'} />
            <span className={`text-[11px] font-[900] ${currentData.result === 'N/A' ? 'text-slate-500 dark:text-[#cbd5e1]' : 'text-[#64748b]'}`}>不适用</span>
          </button>
        </div>

        {/* Notes Header nTitleD */}
        <div className="mt-[24px] flex justify-between items-center w-full">
          <div className="flex items-center gap-[8px]">
            <FileText size={14} className="text-slate-500 dark:text-[#cbd5e1]" />
            <span className="text-[10px] font-[800] text-slate-500 dark:text-[#cbd5e1]">备注详情</span>
          </div>
          <button onClick={() => handleAddMedia()} className="w-[24px] h-[24px] rounded-[6px] border border-slate-200 dark:border-[#334155] flex items-center justify-center active:scale-90 transition-all hover:bg-slate-100 dark:hover:bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none shrink-0">
            <Camera size={14} className="text-[#64748b]" />
          </button>
        </div>

        {/* Media Block (If any) */}
        {currentData.media && currentData.media.length > 0 && (
          <div className="mt-[12px] flex gap-3 overflow-x-auto pb-2 scrollbar-hide min-h-[4rem]">
              {currentData.media.map((m) => {
                const imgUrls = currentData.media.filter(i => i.type !== 'video').map(i => i.url);
                const imgIdx = imgUrls.indexOf(m.url);
                return (
                  <div key={m.id} className="relative shrink-0 w-16 h-16 rounded-[1.2rem] overflow-hidden border border-slate-200 dark:border-[#334155] transition-all hover:scale-105 active:scale-95 group">
                    <img
                      src={m.url}
                      alt="evidence"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 cursor-pointer"
                      onClick={() => imgIdx >= 0 && setLightbox({ images: imgUrls, index: imgIdx })}
                    />
                    <button onClick={() => updateCurrentResult({ media: currentData.media.filter(item => item.id !== m.id) })} className="absolute top-1 right-1 p-1 bg-black/50 text-slate-900 dark:text-white rounded-full"><X size={10} /></button>
                  </div>
                );
              })}

          </div>
        )}

        <div className="mt-[16px] w-full min-h-[48px] rounded-[24px] border border-slate-200 dark:border-[#334155] flex items-start px-[20px] py-[13px] bg-transparent focus-within:border-[#3b82f6]/50 transition-colors">
          <textarea
            placeholder="点击新增备注..."
            value={currentData.notes || ''}
            onChange={(e) => updateCurrentResult({ notes: e.target.value })}
            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            rows={1}
            className="w-full bg-transparent text-[13px] font-[500] text-slate-800 dark:text-slate-200 placeholder:text-[#64748b] focus:outline-none resize-none overflow-hidden leading-[22px]"
          />
        </div>
      </main>

      {/* Footer Navigation fD14 */}
      <footer className="fixed bottom-0 left-0 right-0 h-[88px] bg-slate-50 dark:bg-[#0f1523] border-t border-slate-200 dark:border-[#334155]/50 flex items-center pt-[6px] px-[16px] pb-[20px] z-50">
        <div className="w-full flex justify-between items-center">
          <button onClick={() => { resetAllFields(); setView('home'); }} className="flex flex-col items-center justify-center w-[64px] gap-[6px] transition-all">
            <Home size={24} className="text-[#64748b]" />
            <span className="text-[11px] font-[800] text-[#64748b] whitespace-nowrap leading-none">首页</span>
          </button>
          
          <button onClick={convertToBug} className="flex flex-col items-center justify-center w-[64px] gap-[6px] transition-all">
            <Bug size={24} className="text-[#ef4444]" />
            <span className="text-[11px] font-[800] text-[#ef4444] whitespace-nowrap leading-none">提报问题</span>
          </button>

          <button onClick={prevCase} className="flex flex-col items-center justify-center w-[72px] gap-[6px] transition-all">
            <ChevronLeft size={24} className="text-[#64748b]" />
            <span className="text-[11px] font-[800] text-[#64748b] whitespace-nowrap leading-none">上一个</span>
          </button>
          
          {currentCaseIndex === cases.length - 1 ? (
            <button onClick={handleNextClick} className="flex flex-col items-center justify-center w-[64px] gap-[6px] transition-all">
              <CheckCircle2 size={24} className="text-[#10b981]" />
              <span className="text-[11px] font-[800] text-[#10b981] whitespace-nowrap leading-none">完成</span>
            </button>
          ) : (
            <button onClick={handleNextClick} className="flex flex-col items-center justify-center w-[64px] gap-[6px] transition-all">
              <ChevronRight size={24} className="text-[#2563eb]" />
              <span className="text-[11px] font-[800] text-[#2563eb] whitespace-nowrap leading-none">下一个</span>
            </button>
          )}
        </div>
      </footer>

      {/* Side Menu (Case Navigator) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/70" onClick={() => setIsMenuOpen(false)} />
          <div className="relative w-[85%] max-w-[360px] ml-auto bg-slate-50 dark:bg-[#0f1523] h-full shadow-[-20px_0_40px_rgba(0,0,0,0.5)] flex flex-col">
            {/* Header — fill: #0f172a, padding: [40,24,16,24] */}
            <div className="bg-slate-50 dark:bg-[#0f1523] flex justify-between items-center pt-[40px] px-[24px] pb-[16px] shrink-0">
              <span className="text-[26px] font-[800] text-slate-900 dark:text-[#f8fafc]">用例导航</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-[40px] h-[40px] rounded-[20px] bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none flex items-center justify-center active:scale-90 transition-all"
              >
                <X size={20} className="text-slate-500 dark:text-[#cbd5e1]" />
              </button>
            </div>

            {/* 缺陷中心 button */}
            <div className="px-[16px] pt-[12px] shrink-0">
              <button
                onClick={() => { setShowBugList(true); setIsMenuOpen(false); }}
                className="w-full h-[48px] rounded-[16px] border border-[#ef4444]/40 bg-transparent flex items-center justify-center gap-[8px] active:scale-95 transition-all"
              >
                <Bug size={16} className="text-[#ef4444]" />
                <span className="text-[13px] font-[700] text-[#ef4444]">缺陷中心 ({bugs.length})</span>
              </button>
            </div>

            {/* Filter Tags */}
            <div className="px-[16px] pt-[16px] pb-[8px] flex gap-[8px] overflow-x-auto shrink-0 scrollbar-hide">
              {allCategories.map(cat => {
                const isActive = !hiddenCategories.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleFilter(cat)}
                    className={`px-[12px] py-[6px] rounded-[12px] text-[11px] font-[800] whitespace-nowrap transition-all ${isActive ? 'bg-[#3b82f6] text-white border border-[#2563eb]' : 'bg-transparent border border-slate-200 dark:border-[#334155] text-[#64748b]'}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Case list */}
            <div className="flex-1 overflow-y-auto px-[16px] py-[12px] space-y-[8px] custom-scrollbar">
              {cases.map((c, i) => {
                let cat = c.category || '未分类';
                const funcCat = c.function_category || c.functionCategory || '';
                
                if (cat === '手机应用' || cat === '手机APP') {
                  if (funcCat.match(/iOS/i)) {
                    cat = '手机应用-iOS';
                  } else if (funcCat.match(/Android|安卓/i)) {
                    cat = '手机应用-Android';
                  }
                }
                
                if (hiddenCategories.has(cat)) return null;
                
                let tagBg = 'bg-[#1e3a8a]';
                let tagText = 'text-[#60a5fa]';
                
                if (funcCat.includes('蓝键')) {
                  tagBg = 'bg-blue-500/20'; tagText = 'text-blue-400';
                } else if (funcCat.includes('红键')) {
                  tagBg = 'bg-red-500/20'; tagText = 'text-red-400';
                } else if (funcCat.includes('白键')) {
                  tagBg = 'bg-slate-200/20'; tagText = 'text-slate-800 dark:text-slate-200';
                } else if (funcCat.includes('WiFi')) {
                  tagBg = 'bg-cyan-500/20'; tagText = 'text-cyan-400';
                } else if (funcCat.match(/iOS/i)) {
                  tagBg = 'bg-yellow-500/20'; tagText = 'text-yellow-400';
                } else if (funcCat.match(/Android|安卓/i)) {
                  tagBg = 'bg-emerald-500/20'; tagText = 'text-emerald-400';
                } else if (funcCat.includes('APP') || funcCat.includes('手机')) {
                  tagBg = 'bg-emerald-500/20'; tagText = 'text-emerald-400';
                }

                return (
                  <div
                    key={c.id}
                    ref={i === currentCaseIndex ? activeCaseRef : null}
                    onClick={() => { setCurrentCaseIndex(i); setIsMenuOpen(false); }}
                    className={`px-[16px] py-[12px] rounded-[16px] border transition-all cursor-pointer flex items-center gap-[12px] active:scale-95 ${i === currentCaseIndex ? 'bg-[#2563eb] border-[#3b82f6]' : 'bg-transparent border-slate-200 dark:border-[#334155] hover:border-slate-200 dark:border-[#475569]'}`}
                  >
                    <div className={`w-[32px] h-[32px] rounded-[10px] flex items-center justify-center font-[900] text-[12px] shrink-0 ${i === currentCaseIndex ? 'bg-white/20 text-white' : 'bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none text-slate-500 dark:text-[#cbd5e1]'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
                      {funcCat && (
                        <span className={`text-[9px] font-[800] px-[6px] py-[2px] rounded-[4px] self-start leading-none ${i === currentCaseIndex ? 'bg-white/20 text-white' : `${tagBg} ${tagText}`}`}>
                          {funcCat}
                        </span>
                      )}
                      <span className={`text-[13px] font-[900] leading-tight truncate ${i === currentCaseIndex ? 'text-white' : 'text-slate-900 dark:text-[#f8fafc]'}`}>{c.function}</span>
                      <div className="flex items-center gap-[4px]">
                        <span className={`text-[11px] font-[500] truncate leading-none ${i === currentCaseIndex ? 'text-white/70' : 'text-[#64748b]'}`}>{c.content || c.expected || ''}</span>
                        <span className={`text-[9px] font-[700] shrink-0 ${i === currentCaseIndex ? 'text-white/40' : 'text-slate-300 dark:text-[#475569]'}`}>#{c.id}</span>
                      </div>
                    </div>
                    {caseResults[i]?.result === 'Pass' && <CheckCircle2 size={16} className="text-[#10b981] shrink-0" />}
                    {caseResults[i]?.result === 'Fail' && <XCircle size={16} className="text-[#ef4444] shrink-0" />}
                    {caseResults[i]?.result === 'N/A' && <div className="w-[8px] h-[8px] rounded-full bg-[#64748b] shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bug Modal — 缺陷中心 */}
      {showBugList && (
        <div className="fixed inset-0 z-[100]" style={{background: '#00000099'}}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-50 dark:bg-[#0f1523] rounded-t-[32px] flex flex-col overflow-hidden"
            style={{maxHeight: '85vh', gap: 0, paddingTop: 24}}
          >
            {/* topNav: justify-between, px-24 */}
            <div className="flex justify-between items-center px-[24px] pb-[24px]">
              <span className="text-[18px] font-[900] italic text-[#ef4444]">缺陷中心</span>
              <button
                onClick={() => setShowBugList(false)}
                className="w-[40px] h-[40px] rounded-[20px] bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none flex items-center justify-center active:scale-90 transition-all"
              >
                <X size={20} className="text-slate-500 dark:text-[#cbd5e1]" />
              </button>
            </div>

            {/* stats: px-24 */}
            <div className="px-[24px] pb-[20px]">
              <span className="text-[12px] font-[600] text-[#64748b]">当前会话内共计 {bugs.length} 个待跟进缺陷</span>
            </div>

            {/* dScroll: gap-20, px-24, pb-24 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-[20px] px-[24px] pb-[24px]">
              {bugs.length === 0 ? (
                <div className="py-16 text-center text-[12px] font-[600] text-[#64748b]">暂无缺陷记录</div>
              ) : (
                bugs.map((bug, idx) => {
                  const linkedCase = cases.find(c => c.id === bug.case_id);
                  const bugNum = String(bug.display_id || idx + 1).padStart(4, '0');
                  let timeStr = '';
                  if (bug.timestamp) {
                    const d = new Date(bug.timestamp.replace(' ', 'T'));
                    if (!isNaN(d)) {
                      const h = d.getHours();
                      const m = String(d.getMinutes()).padStart(2, '0');
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const h12 = h % 12 || 12;
                      timeStr = `${h12}:${m} ${ampm} 上报`;
                    }
                  }
                  return (
                    <div
                      key={bug.id || idx}
                      className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[20px] border border-slate-200 dark:border-[#334155] flex flex-col"
                      style={{padding: 20, gap: 16}}
                    >
                      {/* d1Top: justify-between */}
                      <div className="flex justify-between items-center">
                        <span className="text-[14px] font-[900] text-slate-900 dark:text-[#f1f5f9]">#BUG-{bugNum}</span>
                        {/* loc1D: near_me icon, #60a5fa, 18px inside #1e293b rounded-16 32x32 */}
                        <button
                          onClick={() => {
                            const targetIndex = cases.findIndex(c => c.id === bug.case_id);
                            if (targetIndex !== -1) {
                              setCurrentCaseIndex(targetIndex);
                              setShowBugList(false);
                            }
                          }}
                          className="w-[32px] h-[32px] rounded-[16px] bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none flex items-center justify-center active:scale-90 transition-all"
                        >
                          <Send size={14} className="text-[#60a5fa]" />
                        </button>
                      </div>
                      {/* d1Mid: link icon #64748b + case ref */}
                      <div className="flex items-center gap-[8px]">
                        <Link size={16} className="text-[#64748b] shrink-0" />
                        <span className="text-[12px] font-[600] text-slate-500 dark:text-[#cbd5e1]">关联用例：Case {bug.case_id} - {linkedCase?.function || '未知'}</span>
                      </div>
                      {/* txt: description */}
                      <span className="text-[14px] font-[600] text-slate-700 dark:text-[#cbd5e1] break-words leading-relaxed">{bug.description}</span>
                      {/* pRow: only show when there's media */}
                      {bug.media && bug.media.length > 0 && (
                        <div className="flex gap-[8px] flex-wrap">
                          {bug.media.slice(0, 4).map((m, mi) => {
                            const imgUrls = bug.media.filter(x => x.type !== 'video').map(x => x.url);
                            const imgIdx = imgUrls.indexOf(m.url);
                            return (
                              <div
                                key={mi}
                                className="w-[64px] h-[64px] rounded-[8px] bg-[#334155] overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-[#3b82f6] transition-all active:scale-95"
                                onClick={() => m.type !== 'video' && imgIdx >= 0 && setLightbox({ images: imgUrls, index: imgIdx })}
                              >
                                {m.type === 'video' ? (
                                  <video src={m.url} className="w-full h-full object-cover" />
                                ) : (
                                  <img src={m.url} alt={`media-${mi}`} className="w-full h-full object-cover" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* foot: timestamp */}
                      {timeStr ? (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-[500] text-[#64748b]">{timeStr}</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
    </>
  );
}
