import React, { useState } from 'react';
import { ChevronLeft, Download, Bug, CheckCircle2, XCircle, AlertCircle, RefreshCw, X, User, Database, ShieldCheck, Clock } from 'lucide-react';
import { formatDateTime } from '../utils/formatters.js';
import { exportExcelReport } from '../utils/exportExcel.js';
import { FIELD_LABELS } from '../constants/labels.js';

export default function ReportView({
  cases, caseResults, bugs,
  vehicleModel, modelYear, vin, address, architecture, iviModule, commModule, tester, mileage,
  packagePhoto, envPhoto,
  setView, handleFullReset,
}) {
  const [showBugModal, setShowBugModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Detect WeChat built-in browser
  const isWeChat = /MicroMessenger/i.test(navigator.userAgent);

  const stats = caseResults.reduce((acc, curr) => {
    if (curr.result === 'Pass') acc.pass++;
    else if (curr.result === 'Fail') acc.fail++;
    else if (curr.result === 'N/A') acc.na++;
    return acc;
  }, { pass: 0, fail: 0, na: 0 });

  const reportIssues = [
    ...caseResults
      .map((res, idx) => ({ ...res, ...(cases[idx] || {}) }))
      .filter(item => item.result === 'Fail')
      .map(item => ({
        type: 'FAIL',
        caseId: item.id || 'N/A',
        category: item.category,
        functionCategory: item.function_category || item.functionCategory,
        function: item.function,
        content: item.content,
        description: item.notes || `[${item.function || 'Unknown'}] Measurement Inconsistency`,
        appDuration: item.appFeedbackTime && item.startTime
          ? `${((item.appFeedbackTime - item.startTime) / 1000).toFixed(2)}s`
          : 'N/A'
      }))
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-y-auto pb-12">
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-8">
        <header className="flex justify-between items-end border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <button onClick={() => setView('test')} className="flex items-center text-slate-500 hover:text-blue-500 font-bold transition-all mb-4 group">
              <ChevronLeft size={18} className="group-active:-translate-x-1 transition-transform" /> <span className="text-xs tracking-widest ml-1">Back to Edit Data</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-blue-600 rounded-full" />
              <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase leading-none">
                Mission <span className="text-blue-500">Complete</span>
              </h1>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Validation Test Report</p>
            <p className="text-sm font-black text-blue-500 font-mono italic">{new Date().toLocaleDateString()}</p>
          </div>
        </header>

        {/* Global Summary Card */}
        <section className="automotive-card p-4 sm:p-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter uppercase mb-2 leading-none">MY{modelYear || '--'} {vehicleModel || 'UNIT_X'}</h2>
                <div className="flex gap-2">
                  <span className="bg-slate-900 border border-slate-800 text-blue-400 px-3 py-1 rounded-md text-[20px] font-black uppercase tracking-widest leading-none">{vin || 'VIN_NOT_ENTERED'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">System Architecture</span>
                  <p className="text-lg font-black text-slate-200 border-l-2 border-blue-500/40 pl-4">{architecture || 'DEFAULT_CORE'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Module Specification</span>
                  <p className="text-sm font-black text-slate-400 border-l-2 border-slate-800 pl-4 uppercase tracking-widest truncate">{iviModule} // {commModule}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Address</span>
                <p className="text-sm font-bold text-slate-300 italic truncate mt-1" title={address}>{address || 'Testing Hub - Alpha'}</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Tester</span>
                  <p className="text-lg font-black text-white uppercase tracking-tighter leading-none">{tester || 'ALPHA'}</p>
                </div>
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20 text-blue-500">
                  <User size={20} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vital stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="automotive-card p-6 flex flex-col items-center justify-center text-center">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tighter">
              {stats.pass + stats.fail + stats.na}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest mt-2 text-slate-600">Completed Cases</span>
          </div>
          <button
            onClick={() => setShowBugModal(true)}
            className="automotive-card p-6 flex flex-col items-center justify-center text-center active:scale-95 transition-all group hover:border-red-500/50"
          >
            <span className="text-3xl sm:text-4xl font-black text-red-500 font-mono tracking-tighter group-hover:scale-110 transition-transform">{bugs.length}</span>
            <span className="text-[10px] font-black uppercase tracking-widest mt-2 text-red-500/60">Open Bugs</span>
          </button>
        </div>

        {/* Verdict Distribution */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-center">
            <div className="text-lg font-black text-emerald-500 font-mono">{stats.pass}</div>
            <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{FIELD_LABELS.pass}</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-center">
            <div className="text-lg font-black text-red-500 font-mono">{stats.fail}</div>
            <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{FIELD_LABELS.fail}</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-center">
            <div className="text-lg font-black text-slate-500 font-mono">{stats.na}</div>
            <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">N/A</div>
          </div>
        </div>

        {/* Detailed Findings */}
        <section className="space-y-4">
          <h3 className="text-subheader px-2">{FIELD_LABELS.issueList}</h3>
          <div className="space-y-4">
            {reportIssues.length === 0 ? (
              <div className="automotive-card py-20 text-center border-dashed border-2">
                <ShieldCheck size={40} className="mx-auto text-emerald-500 opacity-20 mb-4" />
                <p className="text-sm font-black text-slate-700 uppercase tracking-[0.2em]">Deployment Optimal - No Faults Traceable</p>
              </div>
            ) : (
              reportIssues.map((issue, idx) => (
                <div key={idx} className="automotive-card p-4 border-l-4 border-l-red-500">
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <div className="flex items-center min-w-0">
                      <span className="font-black text-[10px] text-blue-500 uppercase tracking-widest whitespace-nowrap">Case {issue.caseId}</span>
                      <div className="invisible sm:visible h-3 w-[1px] bg-slate-800 mx-2 shrink-0" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter truncate">
                        {issue.functionCategory} // {issue.function}
                      </span>
                    </div>
                    <span className="text-[9px] px-2.5 py-1 bg-red-600 rounded text-white font-black uppercase tracking-widest shadow-lg shadow-red-900/20 shrink-0">{issue.type}</span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight italic">{issue.content}</p>
                    <p className="text-sm text-slate-200 font-bold leading-relaxed border-l-2 border-slate-800 pl-4 italic">"{issue.description}"</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Interaction Hub */}
        <footer className="flex gap-4 pt-10">
          <button
            onClick={async () => {
              if (isWeChat) {
                alert('WeChat 浏览器限制直接下载。报告已生成，请点击右上角菜单 (...) 选择 "在浏览器打开" 以完成下载。');
              }
              setIsExporting(true);
              try {
                await exportExcelReport({
                  cases, caseResults, bugs,
                  vehicle: { vehicleModel, modelYear, vin, address, architecture, iviModule, commModule, tester, mileage, packagePhoto, envPhoto },
                });
              } catch (err) { alert(`Export failed: ${err.message}`); } finally { setIsExporting(false); }
            }}
            disabled={isExporting}
            className="flex-1 automotive-btn py-5 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50"
          >
            <Download size={20} className="shrink-0" /> <span className="font-black uppercase tracking-widest text-xs">{isExporting ? 'Packaging Data...' : 'Generate Excel Report'}</span>
          </button>
          <button
            onClick={handleFullReset}
            className="flex-1 bg-slate-900 border border-slate-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-800 flex items-center justify-center gap-3"
          >
            <RefreshCw size={20} className="shrink-0" /> <span className="italic">Finish & Start New</span>
          </button>
        </footer>
      </div>

      {/* Bug Details Modal */}
      {showBugModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="p-4 sm:p-5 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                <h2 className="text-lg sm:text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                  Captured <span className="text-red-500">Bug Details</span>
                </h2>
              </div>
              <button 
                onClick={() => setShowBugModal(false)} 
                className="p-2 sm:p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-auto bg-slate-950/20">
              {bugs.length === 0 ? (
                <div className="py-32 text-center opacity-30 italic font-black uppercase tracking-widest">Anomaly Registry Clear</div>
              ) : (
                <div className="p-4 sm:p-6 space-y-4">
                  {bugs.map((bug, i) => {
                    const linkedCase = cases.find(c => c.id === bug.case_id);
                    return (
                      <div key={i} className="automotive-card p-4 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-6 hover:border-red-500/20 transition-all">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                          <Bug size={18} className="sm:hidden" />
                          <Bug size={24} className="hidden sm:block" />
                        </div>
                        <div className="flex-1 space-y-3 sm:space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Bug ID {i + 1}</span>
                              <div className="flex items-center gap-1.5 text-blue-500">
                                <Clock size={10} />
                                <span className="text-[9px] sm:text-[10px] font-mono font-black">{bug.timestamp ? String(bug.timestamp).substring(0, 16) : '--:--:--'}</span>
                              </div>
                            </div>
                            {(linkedCase?.function_category || linkedCase?.functionCategory) && (
                              <span className="bg-blue-600/10 text-blue-400 text-[8px] font-black px-2 py-0.5 rounded border border-blue-500/10 uppercase tracking-widest leading-none">
                                {linkedCase.function_category || linkedCase.functionCategory}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] sm:text-[11px] font-black text-white italic tracking-tight uppercase leading-normal">{linkedCase?.function || 'Unknown Function'}</span>
                              <div className="h-[1px] bg-white/5 flex-1" />
                            </div>
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 italic uppercase tracking-tight leading-normal">{linkedCase?.content || 'Content description unavailable'}</p>
                          </div>

                          <div className="bg-black/40 border border-white/5 rounded-xl p-3 sm:p-4">
                            <span className="text-[7px] sm:text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Observation / Notes</span>
                            <p className="text-[11px] sm:text-sm font-bold text-slate-200 leading-snug whitespace-pre-wrap">"{bug.description || 'Unexpected functional interruption'}"</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
