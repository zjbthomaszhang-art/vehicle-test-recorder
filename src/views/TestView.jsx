import React, { useRef, useEffect, useState } from 'react';
import {
  Camera, Bug, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle,
  AlertCircle, Menu, X, MinusCircle, Info, Layers, Database
} from 'lucide-react';
import { formatTime } from '../utils/formatters.js';

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
  const activeCaseRef = useRef(null);

  useEffect(() => {
    if (isMenuOpen && activeCaseRef.current) {
      activeCaseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isMenuOpen]);

  const [durations, setDurations] = useState({ car: null, app: null });
  useEffect(() => {
    if (!currentData || !activeCase) return;
    const { startTime, carExecTime, appFeedbackTime } = currentData;
    if (!startTime) { setDurations({ car: null, app: null }); return; }
    const startMs = new Date(startTime).getTime();
    const carMs = carExecTime ? new Date(carExecTime).getTime() : null;
    const appMs = appFeedbackTime ? new Date(appFeedbackTime).getTime() : null;
    const carDur = (!activeCase.hideCarExec && typeof carMs === 'number' && !isNaN(carMs)) ? carMs - startMs : null;
    const appDur = (typeof appMs === 'number' && !isNaN(appMs)) ? appMs - startMs : null;
    setDurations({ car: carDur, app: appDur });
  }, [currentData, activeCase]);

  // --- Swipe Detection ---
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 70;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) nextCase();
    if (distance < -minSwipeDistance) prevCase();
  };

  if (!activeCase || !currentData) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">Initialising Telemetry...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="px-5 py-4 sm:px-8 sm:py-6 bg-slate-900/60 backdrop-blur-3xl border-b border-slate-800 flex justify-between items-center sticky top-0 z-30">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-black text-2xl italic tracking-tighter uppercase leading-none">
            VEHICLE<span className="text-blue-500">LAB</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Vehicle Info */}
            <div className="bg-[#1e293b]/50 border border-blue-500/10 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                MY{modelYear || '25'} {vehicleModel || '557'}
              </span>
            </div>
            
            {/* Sync / Network Status */}
            <div className={`bg-[#1e293b]/50 border px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all ${isOnline ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-amber-500/30'}`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse outline outline-1 outline-offset-1 ${isOnline ? 'bg-emerald-500 outline-emerald-500/50' : 'bg-amber-500 outline-amber-500/50'}`} />
              <span className={`text-[10px] font-black uppercase tracking-tighter ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isOnline ? 'Sync Active' : 'Offline Mode'}
              </span>
            </div>

            {pendingSyncCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-bounce">
                <Database size={10} className="text-amber-500" />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">
                  {pendingSyncCount} Pending
                </span>
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-blue-400 hover:text-blue-300 active:scale-90 transition-all">
          <Menu size={20} />
        </button>
      </header>

      {/* Progress HUD */}
      <div className="mx-4 mt-6 sm:mx-8 automotive-card p-5 sm:p-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
          <span className="text-[10px] font-black bg-blue-600 px-2.5 py-1 rounded-lg text-white uppercase tracking-widest">Case {activeCase.id}</span>
          <span className="text-[10px] font-mono font-black text-slate-500 uppercase">{currentCaseIndex + 1} / {cases.length} Completed</span>
        </div>
        <div className="flex gap-2 mb-3">
          {(activeCase.function_category || activeCase.functionCategory) && (
            <span className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/10">
              {activeCase.function_category || activeCase.functionCategory}
            </span>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase leading-tight mb-2">{activeCase.function}</h2>
        {activeCase.content && <p className="text-xs sm:text-sm text-slate-400 font-bold leading-relaxed mb-4 border-l-2 border-blue-500/30 pl-3 italic">"{activeCase.content}"</p>}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex gap-3 items-start">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[10px] sm:text-xs font-bold text-slate-300 leading-snug tracking-tight">{activeCase.expected || 'No expected criteria specified'}</p>
        </div>
      </div>

      <main 
        className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto pb-36 touch-action-pan-y"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Timing Section */}
        <section className="space-y-3">
          <h3 className="text-subheader"><Clock size={12} className="inline mr-2" /> Timing Capture</h3>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleTimeClick('start')}
              className={`automotive-card p-5 flex justify-between items-center transition-all group ${currentData.startTime ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${currentData.startTime ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>01</div>
                <span className="font-bold text-xs uppercase tracking-widest">Record Start Execution Time</span>
              </div>
              <span className="font-mono text-sm font-black text-blue-400">{formatTime(currentData.startTime)}</span>
            </button>

            {!activeCase.hideCarExec && activeCase.type === 'timing' && (
              <button
                onClick={() => handleTimeClick('car')}
                className={`automotive-card p-5 flex justify-between items-center transition-all group ${currentData.carExecTime ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${currentData.carExecTime ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>02</div>
                  <span className="font-bold text-xs uppercase tracking-widest">Vehicle Execution Success Time</span>
                </div>
                <span className="font-mono text-sm font-black text-amber-500">{formatTime(currentData.carExecTime)}</span>
              </button>
            )}

            {(activeCase.type === 'timing' || activeCase.type === 'query') && (
              <button
                onClick={() => handleTimeClick('app')}
                className={`automotive-card p-5 flex justify-between items-center transition-all group ${currentData.appFeedbackTime ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${currentData.appFeedbackTime ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                    {(activeCase.hideCarExec || activeCase.type === 'query') ? '02' : '03'}
                  </div>
                  <span className="font-bold text-xs uppercase tracking-widest">APP Feedback Success Time</span>
                </div>
                <span className="font-mono text-sm font-black text-emerald-400">{formatTime(currentData.appFeedbackTime)}</span>
              </button>
            )}
          </div>

          {(activeCase.type === 'timing' || activeCase.type === 'query') && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-[1.5rem] p-5 grid grid-cols-2 gap-4">
              {activeCase.type === 'timing' && !activeCase.hideCarExec && (
                <div className="flex flex-col space-y-0.5">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Vehicle Exec Drtn.</span>
                  <span className="text-[9px] italic font-medium text-slate-500">(Vehicle - Start)</span>
                  <div className="font-mono text-lg font-black text-slate-300">{durations.car !== null ? `${(durations.car / 1000).toFixed(2)}s` : '--'}</div>
                </div>
              )}
              <div className="flex flex-col space-y-0.5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">App Feedback Drtn.</span>
                <span className="text-[9px] italic font-medium text-slate-500">(APP - Start)</span>
                <div className="font-mono text-lg font-black text-blue-500">{durations.app !== null ? `${(durations.app / 1000).toFixed(2)}s` : '--'}</div>
              </div>
            </div>
          )}
        </section>

        {/* Verdict Selection */}
        <section className="space-y-3">
          <h3 className="text-subheader"><Layers size={12} className="inline mr-2" /> Final Verdict</h3>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => updateCurrentResult({ result: 'Pass' })} className={`py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] border-2 font-black transition-all active:scale-95 flex flex-col items-center gap-1 ${currentData.result === 'Pass' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-800'}`}>
              <CheckCircle2 size={18} className="sm:size-6" /> <span className="text-[9px] sm:text-[10px] uppercase tracking-widest">Pass</span>
            </button>
            <button onClick={() => updateCurrentResult({ result: 'Fail' })} className={`py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] border-2 font-black transition-all active:scale-95 flex flex-col items-center gap-1 ${currentData.result === 'Fail' ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-800'}`}>
              <XCircle size={18} className="sm:size-6" /> <span className="text-[9px] sm:text-[10px] uppercase tracking-widest">Fail</span>
            </button>
            <button onClick={() => updateCurrentResult({ result: 'N/A' })} className={`py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] border-2 border-slate-800 transition-all active:scale-95 flex flex-col items-center gap-1 ${currentData.result === 'N/A' ? 'bg-slate-800 text-white' : 'bg-slate-950 text-slate-800'}`}>
              <MinusCircle size={18} className="sm:size-6" /> <span className="text-[9px] sm:text-[10px] uppercase tracking-widest">N/A</span>
            </button>
          </div>
        </section>

        {/* Evidence & Notes */}
        <section className="space-y-4 pt-4">
          <div className="flex justify-between items-center group">
            <h3 className="text-subheader">Capture Evidence</h3>
            <button onClick={() => handleAddMedia()} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 active:scale-90 transition-all group-hover:border-blue-500">
              <Camera size={18} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide min-h-[4rem]">
            {currentData.media.map(m => (
              <div key={m.id} className="relative shrink-0 w-16 h-16 rounded-[1.2rem] overflow-hidden border border-slate-800 transition-all hover:scale-105 active:scale-95 group">
                <img src={m.url} alt="evidence" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                <button onClick={() => updateCurrentResult({ media: currentData.media.filter(item => item.id !== m.id) })} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"><X size={10} /></button>
              </div>
            ))}
            {currentData.media.length === 0 && (
              <div className="w-full py-8 border-2 border-dashed border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-700 text-[10px] font-black uppercase tracking-widest">No Visual Assets Captured</div>
            )}
          </div>
          <textarea
            placeholder="Record testing notes, detailed bugdescriptions, or environmental anomalies..."
            value={currentData.notes}
            onChange={(e) => updateCurrentResult({ notes: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] p-6 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-all min-h-[120px] shadow-inner placeholder:text-slate-700"
          />
        </section>
      </main>

      {/* Control Bar */}
      <footer className="fixed bottom-0 inset-x-0 p-3 sm:p-6 bg-slate-950 border-t border-slate-800 flex gap-3 z-40">
        <button
          onClick={() => setConfirmDialog({
            title: 'Terminate Mission?',
            message: 'Caution: Data for the current test case will not be permanently stored.',
            onConfirm: () => {
              resetAllFields();
              setView('home');
              setConfirmDialog(null);
            }
          })}
          className="p-2 sm:p-4 bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl text-slate-500 hover:text-white flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90"
        >
          <ChevronLeft size={20} className="sm:size-7" />
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider">Home</span>
        </button>
        <button
          onClick={saveTemporarily}
          className="p-2 sm:p-4 bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl text-emerald-500 hover:text-emerald-400 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90"
        >
          <Clock size={20} className="sm:size-7" />
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider">Save</span>
        </button>
        <button onClick={convertToBug} className="flex-1 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1 font-black text-[10px] sm:text-xs uppercase tracking-widest active:scale-95 transition-all">
          <Bug size={20} className="sm:size-7" /> Make Bug
        </button>
        <button onClick={nextCase} className="flex-[1.5] automotive-btn py-3 sm:py-5 flex items-center justify-center gap-2 sm:gap-4 group">
          <span className="italic text-[11px] sm:text-sm">{currentCaseIndex === cases.length - 1 ? 'Save & Finish' : 'Save & Next'}</span>
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </footer>

      {/* Side Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="relative w-72 sm:w-80 ml-auto bg-slate-900 h-full p-6 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic tracking-tighter uppercase">Case Navigator</h3>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-500"><X size={20} /></button>
            </div>
            <button onClick={() => { setShowBugList(true); setIsMenuOpen(false); }} className="w-full py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 mb-6 transition-all hover:bg-red-500/20">
              <Bug size={14} /> Bugs ({bugs.length})
            </button>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {cases.map((c, i) => (
                <div
                  key={c.id}
                  ref={i === currentCaseIndex ? activeCaseRef : null}
                  onClick={() => { setCurrentCaseIndex(i); setIsMenuOpen(false); }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 active:scale-95 ${i === currentCaseIndex ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-950 border-slate-800/50 text-slate-500 hover:border-slate-700'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 border ${i === currentCaseIndex ? 'bg-white/20 border-white/20' : 'bg-slate-900 border-slate-800'}`}>{c.id}</div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {(c.function_category || c.functionCategory) && (
                        <span className={`text-[7px] font-black uppercase px-1 rounded ${i === currentCaseIndex ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'}`}>{c.function_category || c.functionCategory}</span>
                      )}
                    </div>
                    <div className="text-[11px] font-black leading-tight uppercase italic">{c.function}</div>
                    <div className={`text-[9px] font-bold truncate leading-none ${i === currentCaseIndex ? 'text-white/60' : 'text-slate-600'}`}>{c.content}</div>
                  </div>
                  {caseResults[i]?.result === 'Pass' && <CheckCircle2 size={16} className="text-green-400 shrink-0" />}
                  {caseResults[i]?.result === 'Fail' && <XCircle size={16} className="text-red-400 shrink-0" />}
                  {caseResults[i]?.result === 'N/A' && <MinusCircle size={16} className="text-slate-500 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bug Modal */}
      {showBugList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowBugList(false)} />
          <div className="relative bg-[#0d1117] border border-white/5 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="p-4 sm:p-6 flex justify-between items-center border-b border-white/5 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                <h2 className="text-lg sm:text-xl font-black italic tracking-tighter uppercase text-white leading-none">
                  <span className="text-red-500 mr-2">CURRENT</span>BUG LIST
                </h2>
              </div>
              <button 
                onClick={() => setShowBugList(false)} 
                className="p-2 sm:p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 custom-scrollbar">
              {bugs.length === 0 ? (
                <div className="py-24 text-center opacity-20 italic font-black uppercase tracking-[0.3em] text-sm">No Faults Logged</div>
              ) : (
                bugs.map((bug, idx) => {
                  const linkedCase = cases.find(c => c.id === bug.case_id);
                  return (
                    <div key={bug.id || idx} className="relative bg-[#161b22] border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 shadow-xl">
                      {/* Top Metadata Row */}
                      <div className="flex justify-between items-start mb-4 gap-2 sm:gap-4">
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                             <span className="bg-red-500/10 text-red-500 text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-full uppercase tracking-widest border border-red-500/10 shrink-0">Bug #{idx + 1}</span>
                             <div className="flex items-center gap-1 text-slate-500">
                               <Clock size={10} className="sm:hidden" />
                               <Clock size={12} className="hidden sm:block" />
                               <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-tight">{bug.timestamp}</span>
                             </div>
                          </div>
                          {(linkedCase?.function_category || linkedCase?.functionCategory) && (
                            <span className="w-fit bg-blue-600/10 text-blue-400 text-[8px] sm:text-[9px] font-black px-2 sm:px-2.5 py-1 rounded-lg uppercase tracking-widest border border-blue-500/10">
                              {linkedCase.function_category || linkedCase.functionCategory}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const targetIndex = cases.findIndex(c => c.id === bug.case_id);
                            if (targetIndex !== -1) {
                              setCurrentCaseIndex(targetIndex);
                              setShowBugList(false);
                            }
                          }}
                          className="bg-blue-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.05em] sm:tracking-[0.1em] px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/20 shrink-0"
                        >
                          Inspect Case
                        </button>
                      </div>

                      <div className="flex gap-4 sm:gap-6 items-start">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-red-500/5 border border-red-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                          <Bug size={18} className="text-red-500 sm:hidden" />
                          <Bug size={24} className="text-red-500 hidden sm:block" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <h3 className="text-base sm:text-xl font-black text-white italic tracking-tighter shrink-0 leading-none">Case {bug.case_id}</h3>
                            <div className="h-[1px] bg-white/5 flex-1" />
                          </div>
                          <div className="mb-4">
                            <span className="text-[10px] sm:text-[11px] font-black text-blue-400 italic uppercase tracking-tight block leading-normal">
                              {linkedCase?.function || 'Unknown Function'}
                            </span>
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 italic mt-0.5 uppercase tracking-tight block leading-normal">
                              {linkedCase?.content || 'Case content description unavailable'}
                            </p>
                          </div>

                          {/* Observation Inset */}
                          <div className="bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 group">
                            <div className="flex justify-between items-center">
                              <span className="text-[7px] sm:text-[8px] font-black text-slate-600 uppercase tracking-widest">Observation / Notes</span>
                              <Info size={12} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-black text-slate-200 italic leading-relaxed whitespace-pre-wrap">"{bug.description}"</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
