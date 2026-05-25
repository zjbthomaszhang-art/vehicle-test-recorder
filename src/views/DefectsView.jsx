import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, User, Bug, Plus, ShieldAlert, ArrowLeft, UserCircle as LucideUserCircle, AlertTriangle, Calendar, Hash, Car, Gauge, MapPin, Sun, Moon } from 'lucide-react';
import CustomSelect from '../components/CustomSelect.jsx';
import { API_BASE } from '../constants.js';
import { FIELD_LABELS } from '../constants/labels.js';
import MobileNavigator from '../components/MobileNavigator.jsx';
import { useTheme } from '../hooks/useTheme.js';

const STAGES = [
  { id: 'Plan', label: '新提报', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/50' },
  { id: 'Do', label: '处理中', color: 'text-[#eab308]', bg: 'bg-[#eab308]/10', border: 'border-[#eab308]/50' },
  { id: 'Check', label: '验证中', color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10', border: 'border-[#3b82f6]/50' },
  { id: 'Act', label: '已解决', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10', border: 'border-[#10b981]/50' }
];

export default function DefectsView({ setView, bugs, setAllBugs, cases, historySessions, API_BASE }) {
  const { theme, toggleTheme } = useTheme();
  const [casesMap, setCasesMap] = useState({});
  const [sessionsMap, setSessionsMap] = useState({});

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState(''); // Mock priority filter

  // Responsive UI state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedBugId, setExpandedBugId] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const cMap = {};
    if (Array.isArray(cases)) cases.forEach(c => cMap[c.id] = c);
    setCasesMap(cMap);

    const sMap = {};
    if (Array.isArray(historySessions)) historySessions.forEach(s => sMap[s.id] = s);
    setSessionsMap(sMap);
  }, [cases, historySessions]);

  const handleStatusChange = async (bugId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/bugs/${bugId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setAllBugs(bugs.map(b => b.id === bugId ? { ...b, status: newStatus } : b));
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleSelectStatus = (bugId, newStatus) => {
    handleStatusChange(bugId, newStatus);
    setExpandedBugId(null);
  };

  const filteredBugs = React.useMemo(() => {
    return bugs.filter(b => {
      let match = true;
      if (filterStatus) {
        if (b.status !== filterStatus && !(filterStatus === 'Plan' && !b.status)) match = false;
      }
      if (searchQuery) {
        const caseDef = casesMap[b.case_id];
        const text = `${b.description} ${b.function || caseDef?.function || ''} ${b.expected || caseDef?.expected || ''}`.toLowerCase();
        if (!text.includes(searchQuery.toLowerCase())) match = false;
      }
      return match;
    });
  }, [bugs, filterStatus, searchQuery, casesMap]);

  // KPI Calculations
  const { totalDefects, unresolvedCount, inProgressCount, resolvedCount } = React.useMemo(() => {
    let unres = 0, inProg = 0, res = 0;
    bugs.forEach(b => {
      const s = b.status || 'Plan';
      if (s === 'Plan') unres++;
      else if (s === 'Do' || s === 'Check') inProg++;
      else if (s === 'Act') res++;
    });
    return {
      totalDefects: bugs.length,
      unresolvedCount: unres,
      inProgressCount: inProg,
      resolvedCount: res
    };
  }, [bugs]);

  const renderMobile = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <header className="px-[16px] pt-[44px] pb-[8px] flex justify-between items-center w-full z-10 shrink-0">
        <div className="flex items-center gap-[12px]">
          <span className="text-[26px] font-[900] text-slate-900 dark:text-[#f8fafc] leading-none tracking-tight">缺陷管理</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-[16px] pt-[16px] pb-[100px] flex flex-col gap-[24px] custom-scrollbar">
        {/* KPIs Grid */}
        <div className="flex flex-col gap-[12px]">
          <div className="flex gap-[12px] w-full">
            <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[12px] border border-slate-200 dark:border-[#334155] p-[16px] flex flex-col gap-[4px]">
               <span className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">总计缺陷</span>
               <span className="text-[24px] font-[800] text-slate-900 dark:text-[#f8fafc] leading-none">{totalDefects}</span>
            </div>
            <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[12px] border border-slate-200 dark:border-[#334155] p-[16px] flex flex-col gap-[4px]">
               <span className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">未解决</span>
               <span className="text-[24px] font-[800] text-[#ef4444] leading-none">{unresolvedCount}</span>
            </div>
          </div>
          <div className="flex gap-[12px] w-full">
            <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[12px] border border-slate-200 dark:border-[#334155] p-[16px] flex flex-col gap-[4px]">
               <span className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">处理中</span>
               <span className="text-[24px] font-[800] text-[#eab308] leading-none">{inProgressCount}</span>
            </div>
            <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[12px] border border-slate-200 dark:border-[#334155] p-[16px] flex flex-col gap-[4px]">
               <span className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">已解决</span>
               <span className="text-[24px] font-[800] text-[#10b981] leading-none">{resolvedCount}</span>
            </div>
          </div>
        </div>

        {/* Filters Segment */}
        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[20px] p-[16px] flex flex-col gap-[12px]">
           <span className="text-[12px] font-[900] text-slate-500 dark:text-[#94a3b8]">筛选缺陷记录</span>
           <div className="flex items-center gap-[8px] w-full">
              <div className="flex-1 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[12px] flex items-center gap-[8px] focus-within:border-[#3b82f6] transition-colors">
                 <Search size={16} strokeWidth={2.5} className="text-[#64748b]" />
                   <input
                     type="text"
                     placeholder="搜索缺陷..."
                     className="bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-[12px] placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-normal font-sans w-full text-[16px] font-[700]"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
              </div>
              <CustomSelect
               textColor="text-slate-900 dark:text-white text-[16px] font-[700]"
               value={filterStatus}
               onChange={setFilterStatus}
               options={[{value:'',label:'全部状态'}, ...STAGES.map(s=>({value:s.id,label:s.label}))]}
               placeholder="状态"
               align="between"
               className="w-[120px] shrink-0 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[12px]"
              />
           </div>
        </div>

        {/* List Header */}
        <div className="flex items-center w-full h-[0px] shrink-0 overflow-visible">
          <span className="text-[12px] font-[900] text-slate-500 dark:text-[#94a3b8]">查询结果 ({filteredBugs.length})</span>
        </div>

        {/* List Segment */}
        <div className="flex flex-col gap-[12px] w-full">
          {filteredBugs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[40px] text-center gap-[12px]">
               <ShieldAlert size={48} className="text-[#1e293b]" strokeWidth={1} />
               <span className="text-[12px] font-[800] text-slate-500 dark:text-[#cbd5e1] uppercase tracking-widest">暂无缺陷动态</span>
            </div>
          ) : (
          <div className="flex flex-col gap-[12px]">
              {filteredBugs.map((bug, idx) => {
               const caseDef = casesMap[bug.case_id];
               const session = sessionsMap[bug.session_id];
               const currentStatus = STAGES.find(s => s.id === (bug.status || 'Plan')) || STAGES[0];
               
               return (
                 <div key={bug.id || idx} className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[16px] flex flex-col transition-transform active:scale-[0.98] shadow-lg">
                    {/* Header: Status bar & ID */}
                    <div className="flex justify-between items-center w-full px-[16px] py-[12px] bg-slate-50 dark:bg-[#1e293b]/30 border-b border-slate-200 dark:border-[#334155] rounded-t-[16px]">
                       <div className="flex items-center gap-[10px]">
                         <Bug size={16} className={currentStatus.color} strokeWidth={2.5} />
                         <span className="text-[14px] font-[900] text-slate-900 dark:text-white">BUG-{bug.id ? String(bug.id).padStart(4, '0') : `${idx + 1024}`}</span>
                       </div>
                       <div className="flex items-center gap-[8px]">
                          <span className="text-[10px] font-[600] text-slate-500 dark:text-[#cbd5e1] bg-slate-100 dark:bg-[#334155] px-[8px] py-[4px] rounded-full border border-slate-200 dark:border-[#334155] flex items-center gap-[4px]">
                             <Calendar size={10} className="mb-[1px]" />
                             {bug.timestamp ? bug.timestamp.split('.')[0] : 'Unknown'}
                          </span>
                       </div>
                    </div>
                    
                    {/* Body: Case Name & Description */}
                    <div className="px-[16px] pt-[16px] pb-[12px] flex flex-col gap-[12px]">
                       <div className="flex flex-col gap-[4px]">
                          <span className="text-[10px] font-[800] bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent uppercase tracking-widest leading-none">
                             {bug.function_category || caseDef?.function_category || caseDef?.category || 'Unknown Category'}
                          </span>
                          <span className="text-[15px] font-[800] text-slate-900 dark:text-[#f8fafc] leading-tight mt-[4px]">
                             {bug.function || caseDef?.function || 'Unknown Function Name'}
                          </span>
                       </div>
                       
                       <div className="bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-[10px] p-[12px] flex items-start gap-[10px]">
                          <AlertTriangle size={16} className="text-[#ef4444] shrink-0 mt-[2px]" strokeWidth={2} />
                          <span className="text-[13px] font-[600] text-slate-800 dark:text-[#e2e8f0] leading-snug">
                             {bug.description || '无详细问题描述'}
                          </span>
                       </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="px-[16px] pb-[16px] mt-[-4px]">
                       <div className="bg-white dark:bg-[#1e293b] rounded-[10px] border border-slate-200 dark:border-[#334155]/50 p-[12px] flex flex-col gap-[10px]">
                          <div className="flex items-center justify-between gap-[8px]">
                             <div className="flex items-center gap-[6px] w-[40%]">
                                <Car size={13} className="text-[#64748b] shrink-0" strokeWidth={2.5} />
                                <span className="text-[11px] font-[700] text-slate-700 dark:text-[#cbd5e1] truncate">{session ? `MY${session.model_year} ${session.vehicle_model}` : '-'}</span>
                             </div>
                             <div className="flex items-center gap-[6px] w-[60%] justify-end">
                                <Hash size={13} className="text-[#64748b] shrink-0" strokeWidth={2.5} />
                                <span className="text-[11px] font-mono font-[700] text-slate-700 dark:text-[#cbd5e1] truncate">{session?.vin || '-'}</span>
                             </div>
                          </div>
                          <div className="w-full h-[1px] bg-slate-200 dark:bg-[#1e293b]/60"></div>
                          <div className="flex items-center justify-between gap-[8px]">
                             <div className="flex items-center gap-[6px] w-[40%]">
                                <Gauge size={13} className="text-[#64748b] shrink-0" strokeWidth={2.5} />
                                <span className="text-[11px] font-[700] text-slate-700 dark:text-[#cbd5e1] truncate">{session?.mileage || '-'}</span>
                             </div>
                             <div className="flex items-center gap-[6px] w-[60%] justify-end">
                                <User size={13} className="text-[#64748b] shrink-0" strokeWidth={2.5} />
                                <span className="text-[11px] font-[700] text-slate-700 dark:text-[#cbd5e1] truncate">{session?.tester || '-'}</span>
                             </div>
                          </div>

                       </div>
                    </div>

                    {/* Footer: Action/Status */}
                    <div className="px-[16px] py-[12px] bg-slate-50 dark:bg-[#1e293b]/20 border-t border-slate-200 dark:border-[#334155] flex justify-between items-center rounded-b-[16px]">
                       <span className="text-[11px] font-[800] text-[#64748b]">当前处理状态</span>
                       <div className="relative flex items-center justify-end h-[30px]">
                          <div 
                            className={`absolute right-full flex items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${expandedBugId === bug.id ? 'max-w-[300px] opacity-100 pr-[8px]' : 'max-w-0 opacity-0 pr-0'} z-10`}
                          >
                            <div className="flex items-center gap-[6px] whitespace-nowrap bg-white dark:bg-[#1e293b] rounded-[6px] shadow-[0_0_8px_8px_#ffffff] dark:shadow-[0_0_8px_8px_#1e293b]">
                              {STAGES.filter(s => s.id !== (bug.status || 'Plan')).map(s => (
                                 <button
                                    key={s.id}
                                    onClick={(e) => { e.stopPropagation(); handleSelectStatus(bug.id, s.id); }}
                                    className={`px-[10px] h-[30px] rounded-[6px] border ${s.bg} ${s.border} ${s.color} font-[800] text-[11px] active:scale-95 transition-all`}
                                 >
                                    {s.label}
                                 </button>
                              ))}
                            </div>
                          </div>
                          <button 
                              onClick={(e) => { e.stopPropagation(); setExpandedBugId(prev => prev === bug.id ? null : bug.id); }}
                              className={`flex items-center justify-center gap-[4px] px-[12px] h-[30px] rounded-[6px] border transition-all active:scale-95 ${currentStatus.bg} ${currentStatus.border} ${currentStatus.color} font-[900] text-[12px] relative z-20`}
                          >
                              {currentStatus.label}
                              <ChevronDown size={14} className={`transition-transform duration-300 ${expandedBugId === bug.id ? 'rotate-90' : ''}`} />
                          </button>
                       </div>
                    </div>

                 </div>
               )
             })}
          </div>
        )}
        </div>

      </main>

      <MobileNavigator activeTab="defects" setView={setView} />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );

  const renderPC = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <header className="px-[40px] pt-[24px] pb-[24px] flex justify-between items-center w-full z-10 shrink-0">
        <div className="flex items-center gap-[16px]">
          <Bug size={28} strokeWidth={2} className="text-[#ef4444]" />
          <div className="flex flex-col gap-[2px]">
            <span className="text-[24px] font-[900] text-slate-900 dark:text-white leading-none tracking-tight italic">缺陷管理</span>
            <span className="text-[10px] font-[800] text-[#64748b]">缺陷生命周期管理</span>
          </div>
        </div>
        <div className="flex items-center gap-[16px]">
          <button 
            onClick={() => setView('home')} 
            className="flex items-center gap-2 border border-slate-200 dark:border-[#334155] rounded-[8px] px-[16px] py-[10px] text-[12px] font-[800] text-[#64748b] hover:text-slate-900 dark:text-white transition-all"
          >
             <ArrowLeft size={14} /> 返回主页
          </button>

          <div className="flex items-center gap-[12px] ml-2">
             <span className="text-[14px] font-[900] text-slate-500 dark:text-[#cbd5e1]">VEHICLE LAB</span>
             <LucideUserCircle size={40} strokeWidth={1.5} className="text-slate-500 dark:text-[#cbd5e1] bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none rounded-full p-1" />
          </div>

          <button 
            onClick={toggleTheme}
            className="border border-slate-200 dark:border-[#334155] rounded-[8px] w-[40px] h-[40px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#1e293b] shadow-sm dark:shadow-none transition-all ml-2"
          >
            {theme === 'dark' ? <Sun size={18} strokeWidth={2} className="text-[#64748b] dark:text-white" /> : <Moon size={18} strokeWidth={2} className="text-[#64748b]" />}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-[40px] pb-[40px] flex flex-col gap-[24px] custom-scrollbar">
        {/* KPIs Grid */}
        <div className="flex gap-[20px] w-full">
            <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[20px] h-[100px] flex flex-col justify-between">
               <span className="text-[13px] font-[900] text-slate-500 dark:text-[#cbd5e1]">总计缺陷</span>
               <span className="text-[32px] font-[900] text-slate-900 dark:text-[#f8fafc] leading-none">{totalDefects}</span>
            </div>
            <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[20px] h-[100px] flex flex-col justify-between">
               <span className="text-[13px] font-[900] text-slate-500 dark:text-[#cbd5e1]">未解决</span>
               <span className="text-[32px] font-[900] text-[#ef4444] leading-none">{unresolvedCount}</span>
            </div>
            <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[20px] h-[100px] flex flex-col justify-between">
               <span className="text-[13px] font-[900] text-slate-500 dark:text-[#cbd5e1]">处理中</span>
               <span className="text-[32px] font-[900] text-[#eab308] leading-none">{inProgressCount}</span>
            </div>
            <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[20px] h-[100px] flex flex-col justify-between">
               <span className="text-[13px] font-[900] text-slate-500 dark:text-[#cbd5e1]">已解决</span>
               <span className="text-[32px] font-[900] text-[#10b981] leading-none">{resolvedCount}</span>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[20px] p-[16px] flex flex-col gap-[12px]">
           <span className="text-[12px] font-[900] text-slate-500 dark:text-[#94a3b8]">筛选缺陷</span>
           <div className="flex justify-between items-center w-full gap-[20px]">
              <div className="flex-1 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[12px] flex items-center gap-[8px] focus-within:border-[#3b82f6] transition-colors">
                 <Search size={16} strokeWidth={2.5} className="text-[#64748b]" />
                 <input 
                   type="text" 
                   placeholder="搜索缺陷..." 
                   className="bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-[12px] w-full text-[16px] font-[700]"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>

              <div className="flex gap-[16px] flex-1 max-w-[300px]">
                 <CustomSelect
                   textColor="text-slate-900 dark:text-white text-[16px] font-[700]"
                   value={filterStatus}
                   onChange={setFilterStatus}
                   options={[{value:'',label:'全部状态'}, ...STAGES.map(s=>({value:s.id,label:s.label}))]}
                   placeholder="状态"
                   align="between"
                   className="flex-1 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[12px]"
                 />
              </div>
           </div>
        </div>

        {/* PC List Header */}
        <div className="flex items-center w-full h-[0px] shrink-0 overflow-visible">
           <span className="text-[14px] font-[900] text-slate-500 dark:text-[#94a3b8] px-[4px]">查询结果 ({filteredBugs.length})</span>
        </div>

        {/* PC Table */}
        <div className="flex flex-col w-full flex-1">
           <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[16px] flex w-full overflow-hidden flex-1 min-h-[300px]">
              <div className="flex-1 overflow-x-auto flex flex-col custom-scrollbar">
             <div className="flex flex-col min-w-[1400px] w-full flex-1 h-full"> 
               <div 
                 className="grid bg-white dark:bg-[#1e293b] px-[24px] py-[16px] text-slate-500 dark:text-[#cbd5e1] text-[12px] font-[800] border-b border-slate-200 dark:border-[#334155] shrink-0"
                 style={{ gridTemplateColumns: '80px 100px 120px 150px 80px 80px 140px 100px minmax(150px, 1fr) minmax(200px, 2fr) 110px', gap: '16px' }}
               >
                 <div>缺陷编号</div>
                 <div>车型年款</div>
                 <div>测试地址</div>
                 <div>VIN</div>
                 <div>总里程数</div>
                 <div>测试人员</div>
                 <div>提交时间</div>
                 <div>功能大类</div>
                 <div>功能</div>
                 <div>问题描述</div>
                 <div>状态</div>
               </div>
               
               <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                 {filteredBugs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-[80px] w-full text-center gap-[12px]">
                       <ShieldAlert size={48} className="text-[#1e293b]" strokeWidth={1} />
                       <span className="text-[14px] font-[800] text-slate-500 dark:text-[#cbd5e1] uppercase tracking-widest">暂无缺陷动态</span>
                    </div>
                 ) : (
                    filteredBugs.map((bug, idx) => {
                      const caseDef = casesMap[bug.case_id];
                      const session = sessionsMap[bug.session_id];
                      const currentStatus = STAGES.find(s => s.id === (bug.status || 'Plan')) || STAGES[0];
                      return (
                        <div 
                          key={bug.id || idx} 
                          className="grid px-[24px] py-[14px] items-center hover:bg-slate-100 dark:hover:bg-[#334155] dark:bg-[#1e293b]/50 border-b border-slate-200 dark:border-[#334155] transition-colors"
                          style={{ gridTemplateColumns: '80px 100px 120px 150px 80px 80px 140px 100px minmax(150px, 1fr) minmax(200px, 2fr) 110px', gap: '16px' }}
                        >
                          <div className="text-[12px] font-[800] bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent truncate">BUG-{bug.id ? String(bug.id).padStart(4, '0') : `${idx + 1024}`}</div>
                          <div className="text-[12px] text-slate-700 dark:text-[#cbd5e1] truncate">{session ? `MY${session.model_year} ${session.vehicle_model}` : '-'}</div>
                          <div className="text-[12px] text-slate-700 dark:text-[#cbd5e1] truncate">{session?.address || '-'}</div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-[#cbd5e1] truncate">{session?.vin || '-'}</div>
                          <div className="text-[12px] text-slate-700 dark:text-[#cbd5e1] truncate">{session?.mileage || '-'}</div>
                          <div className="text-[12px] text-slate-700 dark:text-[#cbd5e1] truncate">{session?.tester || '-'}</div>
                          <div className="text-[11px] text-slate-500 dark:text-[#cbd5e1] truncate">{bug.timestamp ? bug.timestamp.split('.')[0] : '-'}</div>
                          <div className="text-[12px] text-slate-700 dark:text-[#cbd5e1] truncate">{bug.function_category || caseDef?.function_category || caseDef?.category || '-'}</div>
                          <div className="text-[13px] font-[600] text-slate-900 dark:text-[#f8fafc] truncate">{bug.function || caseDef?.function || '-'}</div>
                          <div className="text-[12px] text-slate-500 dark:text-[#cbd5e1] italic truncate">"{bug.description || ''}"</div>
                          <div className={`relative flex items-center justify-end h-[26px] w-[90px]`}>
                             <div 
                               className={`absolute right-full flex items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${expandedBugId === bug.id ? 'max-w-[300px] opacity-100 pr-[8px]' : 'max-w-0 opacity-0 pr-0'} z-10`}
                             >
                               <div className="flex items-center gap-[6px] whitespace-nowrap bg-white dark:bg-[#1e293b] rounded-[6px] shadow-[0_0_8px_8px_#ffffff] dark:shadow-[0_0_8px_8px_#1e293b]">
                                 {STAGES.filter(s => s.id !== (bug.status || 'Plan')).map(s => (
                                    <button
                                       key={s.id}
                                       onClick={(e) => { e.stopPropagation(); handleSelectStatus(bug.id, s.id); }}
                                       className={`px-[10px] h-[26px] rounded-[6px] border ${s.bg} ${s.border} ${s.color} font-[800] text-[11px] active:scale-95 transition-all`}
                                    >
                                       {s.label}
                                    </button>
                                 ))}
                               </div>
                             </div>
                             <button 
                                 onClick={(e) => { e.stopPropagation(); setExpandedBugId(prev => prev === bug.id ? null : bug.id); }}
                                 className={`flex items-center justify-center gap-[4px] w-[90px] h-[26px] rounded-[6px] border transition-all active:scale-95 ${currentStatus.bg} ${currentStatus.border} ${currentStatus.color} font-[900] text-[12px] relative z-20 hover:brightness-125`}
                             >
                                 {currentStatus.label}
                                 <ChevronDown size={14} className={`transition-transform duration-300 ${expandedBugId === bug.id ? 'rotate-90' : ''}`} />
                             </button>
                          </div>
                        </div>
                      );
                    })
                 )}
               </div>
             </div>
           </div>
        </div>
        </div>

      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );

  return isMobile ? renderMobile() : renderPC();
}
