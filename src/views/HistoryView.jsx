import React, { useState, useEffect } from 'react';
import { Search, Edit3, Car, ChevronDown } from 'lucide-react';
import CustomSelect from '../components/CustomSelect.jsx';
import MobileNavigator from '../components/MobileNavigator.jsx';
import { API_BASE, ARCHITECTURES } from '../constants.js';

export default function HistoryView({
  historySessions,
  totalCases,
  setEditingSession,
  onContinueSession,
  setView,
}) {
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterArch, setFilterArch] = useState('');
  const [displayedCount, setDisplayedCount] = useState(20);

  useEffect(() => {
    // Reset displayed count when filters change
    setDisplayedCount(20);
  }, [filterStartDate, filterEndDate, filterCode, filterArch, historySessions]);

  const filteredSessions = historySessions.filter(session => {
    let match = true;
    if (filterStartDate || filterEndDate) {
      const sessionDate = session.timestamp ? new Date(session.timestamp) : null;
      if (sessionDate && !isNaN(sessionDate)) {
        if (filterStartDate && sessionDate < new Date(filterStartDate)) match = false;
        if (filterEndDate && sessionDate > new Date(filterEndDate)) match = false;
      }
    }
    if (filterCode) {
      const arch = (session.vehicle_architecture || session.architecture || '').toLowerCase();
      const code = (session.vehicle_model || session.model_year || '').toLowerCase();
      const q = filterCode.toLowerCase();
      if (!arch.includes(q) && !code.includes(q)) match = false;
    }
    if (filterArch && filterArch !== '全部') {
       const arch = session.vehicle_architecture || session.architecture || '';
       if (arch !== filterArch) match = false;
    }
    return match;
  });

  const handleContinueTest = (sess) => onContinueSession(sess);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    // Load more when user scrolls near the bottom
    if (scrollHeight - scrollTop - clientHeight < 300) {
      if (displayedCount < filteredSessions.length) {
        setDisplayedCount(prev => prev + 20);
      }
    }
  };

  const handleSearch = () => {
    // Just force React to re-compute filteredSessions.
    // They are computed dynamically based on the state above.
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <header className="px-[16px] pt-[44px] pb-[8px] w-full z-10 shrink-0">
        <h1 className="text-[26px] font-[800] text-slate-900 dark:text-white leading-none tracking-tight">历史测试记录</h1>
      </header>

      <main 
        className="flex-1 overflow-y-auto px-[16px] pt-[16px] pb-[100px] flex flex-col gap-[12px] custom-scrollbar"
        onScroll={handleScroll}
      >
        {/* FilterSection */}
        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[20px] p-[16px] flex flex-col gap-[12px] shrink-0">
          <span className="text-[12px] font-[900] text-slate-500 dark:text-[#94a3b8]">筛选测试记录</span>
          
          <div className="flex gap-[8px] w-full">
            <div className="relative flex-1 min-w-0 w-1/2">
              <input 
                 type="date"
                 className={`bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] w-full min-w-0 h-[36px] px-[12px] text-[14px] focus:outline-none focus:border-[#3b82f6] outline-none appearance-none ${!filterStartDate ? 'text-transparent dark:text-transparent' : 'text-slate-900 dark:text-white'}`}
                 value={filterStartDate} 
                 onChange={e => setFilterStartDate(e.target.value)}
              />
              {!filterStartDate && (
                <div className="absolute left-[12px] top-0 bottom-0 flex items-center pointer-events-none">
                  <span className="text-[12px] text-slate-400 dark:text-slate-600">测试开始日期</span>
                </div>
              )}
            </div>
            <div className="relative flex-1 min-w-0 w-1/2">
              <input 
                 type="date"
                 className={`bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] w-full min-w-0 h-[36px] px-[12px] text-[14px] focus:outline-none focus:border-[#3b82f6] outline-none appearance-none ${!filterEndDate ? 'text-transparent dark:text-transparent' : 'text-slate-900 dark:text-white'}`}
                 value={filterEndDate} 
                 onChange={e => setFilterEndDate(e.target.value)}
              />
              {!filterEndDate && (
                <div className="absolute left-[12px] top-0 bottom-0 flex items-center pointer-events-none">
                  <span className="text-[12px] text-slate-400 dark:text-slate-600">测试结束日期</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-[8px] w-full">
            <div className="flex-1 min-w-0">
              <input 
                 type="text" placeholder="工程代码"
                 className="bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] w-full h-[36px] px-[12px] placeholder:text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6] outline-none uppercase placeholder:font-normal text-[16px] font-[700]"
                 value={filterCode} 
                 onChange={e => setFilterCode(e.target.value)}
                 onBlur={e => setFilterCode(e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase())}
                 autoCapitalize="characters"
                 autoCorrect="off"
                 autoComplete="off"
                 spellCheck="false"
              />
            </div>
            <div className="flex-1 min-w-0">
              <CustomSelect
                textColor="text-slate-900 dark:text-white text-[16px] font-[700]"
                value={filterArch}
                onChange={setFilterArch}
                options={[{value:'',label:'全部架构'}, ...ARCHITECTURES]}
                placeholder="总线架构"
                align="between"
                className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[12px] py-[6px]"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="w-full h-[40px] bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 transition-all rounded-[12px] flex items-center justify-center gap-[8px]"
          >
            <Search size={14} className="text-white" />
            <span className="text-[12px] font-[900] text-white">搜索</span>
          </button>
        </div>

        {/* List Header */}
        <div className="flex items-center w-full h-[24px] shrink-0">
           <span className="text-[12px] font-[900] text-slate-500 dark:text-[#94a3b8]">查询结果 ({filteredSessions.length})</span>
        </div>

        {/* ListSection */}
        <div className="flex flex-col gap-[12px] w-full">

           {filteredSessions.length === 0 ? (
             <div className="text-center py-8 text-[#64748b] text-[12px] font-[800]">No sessions found.</div>
           ) : filteredSessions.slice(0, displayedCount).map(sess => {
             const execCount = parseInt(sess.case_count) || 0;
             const passCount = parseInt(sess.pass_count) || 0;
             const passFailCount = parseInt(sess.pass_fail_count) || 0;
             const execRate = totalCases > 0 ? ((execCount / totalCases) * 100).toFixed(0) : 0;
             const passRate = passFailCount > 0 ? ((passCount / passFailCount) * 100).toFixed(0) : 0;

             return (
               <div key={sess.id} className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[20px] p-[14px] flex flex-col gap-[10px]">
                  {/* Top Row */}
                  <div className="flex justify-between items-center w-full">
                     <div className="flex gap-[8px] items-center">
                        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none rounded-[6px] h-[24px] px-[8px] flex items-center">
                           <span className="text-[10px] font-[800] text-slate-700 dark:text-[#cbd5e1]">#{sess.id}</span>
                        </div>
                        <span className="text-[11px] font-[600] text-[#3b82f6]">
                           {sess.timestamp ? String(sess.timestamp).substring(0, 16).replace(/-/g, '/') : ''}
                        </span>
                     </div>
                     <span className={`text-[20px] font-[900] bg-clip-text text-transparent bg-gradient-to-br ${passRate >= 90 ? 'from-[#10b981] via-[#2dd4bf] to-[#3b82f6]' : (passRate >= 60 ? 'from-[#f59e0b] via-[#f97316] to-[#ec4899]' : 'from-[#ef4444] via-[#e11d48] to-[#9333ea]')}`}>
                        通过率 {passRate}%
                     </span>
                  </div>

                  {/* Title Row */}
                  <div className="flex justify-between items-center w-full">
                     <span className="text-[22px] font-[900] text-slate-900 dark:text-white italic">
                        {sess.model_year ? `MY${sess.model_year}` : ''} {sess.vehicle_model || 'Unknown'}
                     </span>
                     <button onClick={() => setEditingSession(sess)} className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors rounded-[10px] w-[32px] h-[32px] flex items-center justify-center -mr-1">
                        <Edit3 size={16} className="text-slate-500 dark:text-[#cbd5e1]" />
                     </button>
                  </div>

                  {/* Info Row */}
                  <div className="flex gap-[12px] items-center w-full">
                     <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none rounded-[10px] w-[36px] h-[36px] flex items-center justify-center shrink-0">
                        <Car size={18} className="text-[#64748b]" />
                     </div>
                     <div className="flex flex-col gap-[2px] min-w-0 flex-1">
                        <span className="text-[12px] font-[normal] text-slate-700 dark:text-[#cbd5e1] truncate">VIN: {sess.vin || 'N/A'}</span>
                        <span className="text-[11px] font-[normal] text-[#64748b] truncate">
                           {sess.test_location || sess.address || 'N/A'} • {sess.tester || 'N/A'}
                        </span>
                     </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex justify-between items-center w-full">
                     <div className="flex items-center">
                        <span className="text-[13px] font-[bold] text-[#64748b]">已执行 {execCount} 条用例，完成进度 {execRate}%</span>
                     </div>
                     <button
                       onClick={() => handleContinueTest(sess)}
                       className="h-[34px] px-[14px] bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 transition-all rounded-[10px] flex items-center justify-center"
                     >
                       <span className="text-[12px] font-[900] text-white">继续测试</span>
                     </button>
                  </div>
               </div>
             );
           })}
        </div>
      </main>
    </div>
  );
}
