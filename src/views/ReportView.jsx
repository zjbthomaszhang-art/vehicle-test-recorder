import React, { useRef, useState } from 'react';
import { Crown, Undo2, CheckCircle2, Upload, X, Link, Send } from 'lucide-react';
import { exportExcelReport } from '../utils/exportExcel.js';

export default function ReportView({
  cases, caseResults, bugs,
  vehicleModel, modelYear, vin, productionStage, address, architecture,
  iviModule, commModule, testEnv, tester, mileage, envPhotos,
  handleFullReset, setView, setToast, setConfirmDialog, resetAllFields
}) {
  const reportRef = useRef(null);
  const [showBugSheet, setShowBugSheet] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const calculateStats = () => {
    let passed = 0;
    let failed = 0;
    let na = 0;
    const failedCases = [];

    cases.forEach((c, index) => {
      const res = caseResults[index];
      const result = res?.result;
      if (result === 'Pass') passed++;
      else if (result === 'Fail') {
        failed++;
        failedCases.push(c);
      }
      else if (result === 'N/A') na++;
    });

    const completed = passed + failed + na;
    return { passed, failed, na, completed, failedCases };
  };

  const stats = calculateStats();

  // Format as YYYY/MM/DD
  const d = new Date();
  const currentDate = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportExcelReport({
        cases, caseResults, bugs,
        vehicle: { vehicleModel, modelYear, vin, productionStage, address, architecture, iviModule, commModule, testEnv, tester, mileage },
      });
      setToast?.({ message: '报告导出成功', type: 'success' });
    } catch (err) {
      setToast?.({ message: '导出失败: ' + err.message, type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFinish = () => {
    setConfirmDialog({
      title: '结束测试并重置',
      message: '确认后将清除本次测试的记录并返回首页。',
      onConfirm: () => {
        resetAllFields();
        setView('home');
        setConfirmDialog(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] text-slate-800 dark:text-slate-100 flex flex-col font-sans" ref={reportRef}>
      <div className="flex-1 overflow-y-auto w-full">

        {/* TitleBlock */}
        <div className="px-[24px] pt-[44px] pb-[12px] flex flex-col gap-[4px] w-full overflow-hidden">
          <div className="relative inline-block pb-[4px] w-fit">
            <h1 className="text-[32px] sm:text-[36px] font-black font-sans tracking-tighter text-slate-900 dark:text-white leading-none uppercase whitespace-nowrap relative z-10 drop-shadow-2xl">
              {['M','I','S','S','I','O','N'].map((char, i) => (
                <span key={`1-${i}`} className="animate-cyber-letter" style={{ animationDelay: `${i * 0.08}s` }}>{char}</span>
              ))}
              <span className="text-red-500 mx-[4px] animate-cyber-letter" style={{ animationDelay: `${7 * 0.08}s` }}>:</span>
              {['C','O','M','P','L','E','T','E'].map((char, i) => (
                <span key={`2-${i}`} className="animate-cyber-letter" style={{ animationDelay: `${(8 + i) * 0.08}s` }}>{char}</span>
              ))}
            </h1>
            <div className="scanline-overlay rounded-[4px]"></div>
          </div>
          <div className="flex justify-between items-center w-full mt-[4px]">
            <span className="text-[14px] font-bold bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent">验证测试报告</span>
            <span className="text-[13px] font-[600] text-[#3b82f6]">{currentDate}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="px-[24px] py-[24px] w-full">
          <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[20px] p-[24px] flex justify-between items-center gap-[16px] w-full">
            <div className="flex flex-col gap-[16px]">
              <span className="text-[22px] font-[900] text-slate-900 dark:text-white leading-none">
                MY{modelYear || '2X'} {vehicleModel || 'BEV'}
              </span>
              <span className="text-[12px] font-bold text-[#3b82f6]">
                VIN: {vin || '尚未录入'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-[4px]">
              <Crown size={48} className="text-[#3b82f6]/50" />
              <span className="text-[11px] font-normal text-[#64748b]">
                {tester || 'ALPHA Tester'}
              </span>
            </div>
          </div>
        </div>

        {/* StatsRow */}
        <div className="px-[24px] pb-[16px] w-full flex gap-[12px]">
          <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[16px] h-[100px] flex flex-col justify-center items-center gap-[4px]">
            <span className="text-[36px] font-[900] text-slate-900 dark:text-white leading-none">{stats.completed}</span>
            <span className="text-[12px] font-normal text-slate-500 dark:text-[#cbd5e1]">已完成</span>
          </div>
          {/* 缺陷 — clickable, opens bug sheet */}
          <button
            onClick={() => setShowBugSheet(true)}
            className="flex-1 bg-red-50 dark:bg-[#450a0a] border border-red-200 dark:border-[#ef4444] rounded-[16px] h-[100px] flex flex-col justify-center items-center gap-[4px] active:scale-95 transition-all"
          >
            <span className="text-[36px] font-[900] text-red-500 dark:text-[#ef4444] leading-none">{bugs.length}</span>
            <span className="text-[12px] font-normal text-red-500 dark:text-[#ef4444]">缺陷</span>
          </button>
        </div>

        {/* VerdictRow */}
        <div className="px-[24px] pb-[24px] w-full flex gap-[8px]">
          <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[12px] h-[64px] flex flex-col justify-center items-center gap-[2px]">
            <span className="text-[20px] font-bold text-[#22c55e] leading-none">{stats.passed}</span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-[#cbd5e1] leading-none">通过</span>
          </div>
          <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[12px] h-[64px] flex flex-col justify-center items-center gap-[2px]">
            <span className="text-[20px] font-bold text-[#ef4444] leading-none">{stats.failed}</span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-[#cbd5e1] leading-none">失败</span>
          </div>
          <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[12px] h-[64px] flex flex-col justify-center items-center gap-[2px]">
            <span className="text-[20px] font-bold text-slate-500 dark:text-[#cbd5e1] leading-none">{stats.na}</span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-[#cbd5e1] leading-none">不适用</span>
          </div>
        </div>

        {/* Findings — 失败记录明细：每个 fail case 一张卡 */}
        <div className="px-[24px] pb-[32px] w-full flex flex-col gap-[12px]">
          <span className="text-[12px] font-[600] text-slate-500 dark:text-[#cbd5e1]">失败记录明细</span>

          {stats.failedCases.length === 0 ? (
            <div className="border border-slate-200 dark:border-[#334155] rounded-[16px] p-[24px] text-center">
              <span className="text-[14px] font-bold text-[#22c55e]">没有任何缺陷记录！</span>
            </div>
          ) : (
            stats.failedCases.map((c, idx) => (
              <div key={c.id || idx} className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[14px] px-[14px] py-[12px] flex flex-col gap-[6px]">
                {/* 标题行 */}
                <div className="flex justify-between items-center gap-[8px]">
                  <span className="text-[12px] font-[700] text-[#ef4444] truncate">
                    Case {c.id} · {c.function_category || c.functionCategory} // {c.function}
                  </span>
                  <span className="text-[10px] font-[900] text-[#ef4444] shrink-0 bg-[#ef4444]/15 px-[8px] py-[2px] rounded-full">FAIL</span>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-slate-50 dark:bg-[#0f1523] border-t border-slate-200 dark:border-[#334155]/50 h-[88px] px-[16px] pt-[6px] pb-[20px] flex gap-[10px] items-center shrink-0">
        <button onClick={() => setView('test')} className="w-[100px] h-[60px] bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[16px] flex flex-col justify-center items-center gap-[4px] active:scale-95 transition-all">
          <Undo2 size={24} className="text-slate-500 dark:text-[#cbd5e1]" />
          <span className="text-[11px] font-[800] text-slate-500 dark:text-[#cbd5e1]">返回修改</span>
        </button>
        <button onClick={handleExportPDF} disabled={isExporting} className="flex-1 h-[60px] bg-[#2563eb] rounded-[16px] flex flex-col justify-center items-center gap-[4px] shadow-[0_4px_12px_rgba(37,99,235,0.38)] active:scale-95 transition-all disabled:opacity-60">
          <Upload size={24} className="text-white" />
          <span className="text-[11px] font-[900] text-white">{isExporting ? '导出中...' : '导出报告'}</span>
        </button>
        <button onClick={handleFinish} className="w-[100px] h-[60px] bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[16px] flex flex-col justify-center items-center gap-[4px] active:scale-95 transition-all">
          <CheckCircle2 size={24} className="text-slate-500 dark:text-[#cbd5e1]" />
          <span className="text-[11px] font-[800] text-slate-500 dark:text-[#cbd5e1]">结束测试</span>
        </button>
      </div>

      {/* Bug Sheet — 缺陷中心弹窗，与 TestView 样式一致 */}
      {showBugSheet && (
        <div className="fixed inset-0 z-[100]" style={{ background: '#00000099' }}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-50 dark:bg-[#0f1523] rounded-t-[32px] flex flex-col overflow-hidden"
            style={{ maxHeight: '85vh', paddingTop: 24 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-[24px] pb-[24px]">
              <span className="text-[18px] font-[900] italic text-[#ef4444]">缺陷中心</span>
              <button
                onClick={() => setShowBugSheet(false)}
                className="w-[40px] h-[40px] rounded-[20px] bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none flex items-center justify-center active:scale-90 transition-all"
              >
                <X size={20} className="text-slate-500 dark:text-[#cbd5e1]" />
              </button>
            </div>

            {/* Stats */}
            <div className="px-[24px] pb-[20px]">
              <span className="text-[12px] font-[600] text-[#64748b]">当前会话内共计 {bugs.length} 个待跟进缺陷</span>
            </div>

            {/* Bug list */}
            <div className="flex-1 overflow-y-auto ios-scrollbar flex flex-col gap-[20px] px-[24px] pb-[24px]">
              {bugs.map((bug, idx) => {
                const linkedCase = cases.find(c => c.id === bug.case_id);
                const bugNum = String(bug.display_id || idx + 1).padStart(4, '0');
                let timeStr = '';
                if (bug.timestamp) {
                  const dt = new Date(bug.timestamp.replace(' ', 'T'));
                  if (!isNaN(dt)) {
                    const h = dt.getHours();
                    const m = String(dt.getMinutes()).padStart(2, '0');
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    timeStr = `${h % 12 || 12}:${m} ${ampm} 上报`;
                  }
                }
                return (
                  <div key={bug.id || idx} className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[20px] flex flex-col" style={{ padding: 20, gap: 16 }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] font-[900] text-slate-900 dark:text-[#f1f5f9]">#BUG-{bugNum}</span>
                      <div className="w-[32px] h-[32px] rounded-[16px] bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none flex items-center justify-center">
                        <Send size={14} className="text-[#60a5fa]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-[8px]">
                      <Link size={16} className="text-[#64748b] shrink-0" />
                      <span className="text-[12px] font-[600] text-slate-500 dark:text-[#cbd5e1]">关联用例：Case {bug.case_id} - {linkedCase?.function || '未知'}</span>
                    </div>
                    <span className="text-[14px] font-[600] text-slate-700 dark:text-[#cbd5e1] break-words leading-relaxed">{bug.description}</span>
                    {bug.media && bug.media.length > 0 && (
                      <div className="flex gap-[8px] flex-wrap">
                        {bug.media.slice(0, 4).map((m, mi) => (
                          <div key={mi} className="w-[64px] h-[64px] rounded-[8px] bg-[#334155] overflow-hidden shrink-0">
                            {m.type === 'video'
                              ? <video src={m.url} className="w-full h-full object-cover" />
                              : <img src={m.url} alt={`media-${mi}`} className="w-full h-full object-cover" />}
                          </div>
                        ))}
                      </div>
                    )}
                    {timeStr && <span className="text-[10px] font-[500] text-[#64748b]">{timeStr}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <style>{`
        .ios-scrollbar::-webkit-scrollbar { width: 3px; }
        .ios-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .ios-scrollbar::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.35); border-radius: 99px; }
        .ios-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.6); }
        .ios-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(148,163,184,0.35) transparent; }
      `}</style>
    </div>
  );
}
