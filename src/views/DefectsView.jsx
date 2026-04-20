import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, User, Bug, Plus, ShieldAlert, ArrowLeft, UserCircle as LucideUserCircle, AlertTriangle, Calendar, Hash, Car, Gauge, MapPin } from 'lucide-react';
import { API_BASE } from '../constants.js';
import { FIELD_LABELS } from '../constants/labels.js';
import MobileNavigator from '../components/MobileNavigator.jsx';

const STAGES = [
  { id: 'Plan', label: '新提报', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/50' },
  { id: 'Do', label: '处理中', color: 'text-[#eab308]', bg: 'bg-[#eab308]/10', border: 'border-[#eab308]/50' },
  { id: 'Check', label: '验证中', color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10', border: 'border-[#3b82f6]/50' },
  { id: 'Act', label: '已解决', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10', border: 'border-[#10b981]/50' }
];

export default function DefectsView({ setView }) {
  const [bugs, setBugs] = useState([]);
  const [casesMap, setCasesMap] = useState({});
  const [sessionsMap, setSessionsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState(''); // Mock priority filter

  // Responsive UI state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/bugs`).then(res => res.json()),
      fetch(`${API_BASE}/cases`).then(res => res.json()),
      fetch(`${API_BASE}/test-sessions`).then(res => res.json())
    ]).then(([bugsData, casesData, sessionsData]) => {
      const cMap = {};
      if (Array.isArray(casesData)) {
        casesData.forEach(c => cMap[c.id] = c);
      }
      setCasesMap(cMap);

      const sMap = {};
      if (Array.isArray(sessionsData)) {
        sessionsData.forEach(s => sMap[s.id] = s);
      }
      setSessionsMap(sMap);

      if (Array.isArray(bugsData)) {
        bugsData.sort((a, b) => {
          const strA = String(a.timestamp || '');
          const strB = String(b.timestamp || '');
          return strB.localeCompare(strA);
        });
        setBugs(bugsData);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

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
        setBugs(bugs.map(b => b.id === bugId ? { ...b, status: newStatus } : b));
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const filteredBugs = bugs.filter(b => {
    let match = true;
    if (filterStatus) {
      if (b.status !== filterStatus && !(filterStatus === 'Plan' && !b.status)) match = false;
    }
    if (searchQuery) {
      const caseDef = casesMap[b.case_id];
      const text = `${b.description} ${caseDef?.function || ''} ${caseDef?.expected || ''}`.toLowerCase();
      if (!text.includes(searchQuery.toLowerCase())) match = false;
    }
    return match;
  });

  // KPI Calculations
  const totalDefects = bugs.length;
  let unresolvedCount = 0;
  let inProgressCount = 0;
  let resolvedCount = 0;

  bugs.forEach(b => {
    const s = b.status || 'Plan';
    if (s === 'Plan') unresolvedCount++;
    else if (s === 'Do' || s === 'Check') inProgressCount++;
    else if (s === 'Act') resolvedCount++;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1523] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderMobile = () => (
    <div className="min-h-screen bg-[#0f1523] text-slate-100 flex flex-col font-sans">
      <header className="px-[24px] pt-[44px] pb-[8px] flex justify-between items-center w-full z-10 shrink-0">
        <div className="flex items-center gap-[12px]">
          <button onClick={() => setView('home')} className="flex items-center justify-center w-[32px] h-[32px] bg-[#1e293b] rounded-full hover:bg-[#334155] transition-colors">
            <ArrowLeft size={16} strokeWidth={2.5} className="text-[#94a3b8]" />
          </button>
          <span className="text-[26px] font-[900] text-[#f8fafc] leading-none tracking-tight">缺陷管理</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-[24px] pt-[16px] pb-[100px] flex flex-col gap-[24px] custom-scrollbar">
        {/* KPIs Grid */}
        <div className="flex flex-col gap-[12px]">
          <div className="flex gap-[12px] w-full">
            <div className="flex-1 bg-[#111827] rounded-[12px] border border-[#1e293b] p-[16px] flex flex-col gap-[4px]">
               <span className="text-[11px] font-[600] text-[#94a3b8]">总计缺陷</span>
               <span className="text-[24px] font-[800] text-[#f8fafc] leading-none">{totalDefects}</span>
            </div>
            <div className="flex-1 bg-[#111827] rounded-[12px] border border-[#1e293b] p-[16px] flex flex-col gap-[4px]">
               <span className="text-[11px] font-[600] text-[#94a3b8]">未解决</span>
               <span className="text-[24px] font-[800] text-[#ef4444] leading-none">{unresolvedCount}</span>
            </div>
          </div>
          <div className="flex gap-[12px] w-full">
            <div className="flex-1 bg-[#111827] rounded-[12px] border border-[#1e293b] p-[16px] flex flex-col gap-[4px]">
               <span className="text-[11px] font-[600] text-[#94a3b8]">处理中</span>
               <span className="text-[24px] font-[800] text-[#eab308] leading-none">{inProgressCount}</span>
            </div>
            <div className="flex-1 bg-[#111827] rounded-[12px] border border-[#1e293b] p-[16px] flex flex-col gap-[4px]">
               <span className="text-[11px] font-[600] text-[#94a3b8]">已解决</span>
               <span className="text-[24px] font-[800] text-[#10b981] leading-none">{resolvedCount}</span>
            </div>
          </div>
        </div>

        {/* Filters Segment */}
        <div className="flex flex-col gap-[12px]">
           <div className="w-full bg-[#111827] border border-[#1e293b] rounded-[12px] py-[12px] px-[16px] flex items-center gap-[8px] focus-within:border-[#3b82f6] transition-colors">
              <Search size={16} strokeWidth={2.5} className="text-[#64748b]" />
              <input 
                type="text" 
                placeholder="搜索缺陷..." 
                className="bg-transparent border-none outline-none text-[13px] text-white placeholder:text-[#94a3b8] w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>

           <div className="flex gap-[12px] w-full">
              <div className="flex-1 bg-[#111827] border border-[#1e293b] rounded-[8px] p-[10px] px-[12px] flex justify-between items-center relative">
                 <select 
                   value={filterStatus}
                   onChange={(e) => setFilterStatus(e.target.value)}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 >
                   <option value="" className="bg-[#111827] text-[#f8fafc]">全部状态</option>
                   {STAGES.map(s => <option key={s.id} value={s.id} className="bg-[#111827] text-[#f8fafc]">{s.label}</option>)}
                 </select>
                 <span className="text-[12px] font-[600] text-[#f8fafc] pointer-events-none">{filterStatus ? STAGES.find(s => s.id === filterStatus)?.label : '全部状态'}</span>
                 <ChevronDown size={14} className="text-[#64748b] pointer-events-none" />
              </div>
              <div className="flex-1 bg-[#111827] border border-[#1e293b] rounded-[8px] p-[10px] px-[12px] flex justify-between items-center relative">
                 <select 
                   value={filterPriority}
                   onChange={(e) => setFilterPriority(e.target.value)}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 >
                   <option value="" className="bg-[#111827] text-[#f8fafc]">所有优先级</option>
                   <option value="high" className="bg-[#111827] text-[#f8fafc]">高优先级(P0/P1)</option>
                   <option value="low" className="bg-[#111827] text-[#f8fafc]">低优先级(P2/P3)</option>
                 </select>
                 <span className="text-[12px] font-[600] text-[#f8fafc] pointer-events-none">{filterPriority === 'high' ? '高优先级(P0/P1)' : filterPriority === 'low' ? '低优先级(P2/P3)' : '所有优先级'}</span>
                 <ChevronDown size={14} className="text-[#64748b] pointer-events-none" />
              </div>
           </div>
        </div>

        {/* List Segment */}
        {filteredBugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[40px] text-center gap-[12px]">
             <ShieldAlert size={48} className="text-[#1e293b]" strokeWidth={1} />
             <span className="text-[12px] font-[800] text-[#475569] uppercase tracking-widest">暂无缺陷动态</span>
          </div>
        ) : (
          <div className="flex flex-col gap-[12px]">
              {filteredBugs.map((bug, idx) => {
               const caseDef = casesMap[bug.case_id];
               const session = sessionsMap[bug.session_id];
               const currentStatus = STAGES.find(s => s.id === (bug.status || 'Plan')) || STAGES[0];
               
               return (
                 <div key={bug.id || idx} className="bg-[#111827] border border-[#1e293b] rounded-[16px] flex flex-col overflow-hidden transition-transform active:scale-[0.98] shadow-lg">
                    {/* Header: Status bar & ID */}
                    <div className="flex justify-between items-center w-full px-[16px] py-[12px] bg-[#1e293b]/30 border-b border-[#1e293b]">
                       <div className="flex items-center gap-[10px]">
                         <Bug size={16} className={currentStatus.color} strokeWidth={2.5} />
                         <span className="text-[14px] font-[900] text-white">#{bug.id || `BUG-${idx + 1024}`}</span>
                       </div>
                       <div className="flex items-center gap-[8px]">
                          <span className="text-[10px] font-[600] text-[#94a3b8] bg-[#0f172a] px-[8px] py-[4px] rounded-full border border-[#1e293b] flex items-center gap-[4px]">
                             <Calendar size={10} className="mb-[1px]" />
                             {bug.timestamp ? bug.timestamp.split('.')[0] : 'Unknown'}
                          </span>
                       </div>
                    </div>
                    
                    {/* Body: Case Name & Description */}
                    <div className="px-[16px] pt-[16px] pb-[12px] flex flex-col gap-[12px]">
                       <div className="flex flex-col gap-[4px]">
                          <span className="text-[10px] font-[800] bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent uppercase tracking-widest leading-none">
                             {caseDef?.function_category || caseDef?.category || 'Unknown Category'}
                          </span>
                          <span className="text-[15px] font-[800] text-[#f8fafc] leading-tight mt-[4px]">
                             {caseDef?.function || 'Unknown Function Name'}
                          </span>
                       </div>
                       
                       <div className="bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-[10px] p-[12px] flex items-start gap-[10px]">
                          <AlertTriangle size={16} className="text-[#ef4444] shrink-0 mt-[2px]" strokeWidth={2} />
                          <span className="text-[13px] font-[600] text-[#e2e8f0] leading-snug">
                             {bug.description || '无详细问题描述'}
                          </span>
                       </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="px-[16px] pb-[16px] mt-[-4px]">
                       <div className="bg-[#0f172a] rounded-[10px] border border-[#1e293b]/50 p-[12px] flex flex-col gap-[10px]">
                          <div className="flex items-center justify-between gap-[8px]">
                             <div className="flex items-center gap-[6px] w-[40%]">
                                <Car size={13} className="text-[#64748b] shrink-0" strokeWidth={2.5} />
                                <span className="text-[11px] font-[700] text-[#cbd5e1] truncate">{session ? `MY${session.model_year} ${session.vehicle_model}` : '-'}</span>
                             </div>
                             <div className="flex items-center gap-[6px] w-[60%] justify-end">
                                <Hash size={13} className="text-[#64748b] shrink-0" strokeWidth={2.5} />
                                <span className="text-[11px] font-mono font-[700] text-[#cbd5e1] truncate">{session?.vin || '-'}</span>
                             </div>
                          </div>
                          <div className="w-full h-[1px] bg-[#1e293b]/60"></div>
                          <div className="flex items-center justify-between gap-[8px]">
                             <div className="flex items-center gap-[6px] w-[40%]">
                                <Gauge size={13} className="text-[#64748b] shrink-0" strokeWidth={2.5} />
                                <span className="text-[11px] font-[700] text-[#cbd5e1] truncate">{session?.mileage || '-'}</span>
                             </div>
                             <div className="flex items-center gap-[6px] w-[60%] justify-end">
                                <User size={13} className="text-[#64748b] shrink-0" strokeWidth={2.5} />
                                <span className="text-[11px] font-[700] text-[#cbd5e1] truncate">{session?.tester || '-'}</span>
                             </div>
                          </div>

                       </div>
                    </div>

                    {/* Footer: Action/Status */}
                    <div className="px-[16px] py-[12px] bg-[#1e293b]/20 border-t border-[#1e293b] flex justify-between items-center">
                       <span className="text-[11px] font-[800] text-[#64748b]">当前处理状态</span>
                       <div className={`rounded-[6px] border relative ${currentStatus.bg} ${currentStatus.border}`}>
                          <select 
                            value={bug.status || 'Plan'}
                            onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                            className={`appearance-none bg-transparent pl-[10px] pr-[26px] py-[4px] text-[12px] font-[900] outline-none cursor-pointer text-center w-full ${currentStatus.color}`}
                          >
                            {STAGES.map(s => (
                              <option key={s.id} value={s.id} className="bg-[#111827] text-slate-100">{s.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} strokeWidth={3} className={`absolute right-[8px] top-1/2 -translate-y-1/2 pointer-events-none ${currentStatus.color}`} />
                       </div>
                    </div>

                 </div>
               )
             })}
          </div>
        )}

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
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 flex flex-col font-sans">
      <header className="px-[40px] pt-[24px] pb-[24px] flex justify-between items-center w-full z-10 shrink-0">
        <div className="flex items-center gap-[16px]">
          <Bug size={28} strokeWidth={2} className="text-[#ef4444]" />
          <div className="flex flex-col gap-[2px]">
            <span className="text-[24px] font-[900] text-white leading-none tracking-tight italic">缺陷管理</span>
            <span className="text-[10px] font-[800] text-[#64748b]">缺陷生命周期管理</span>
          </div>
        </div>
        <div className="flex items-center gap-[16px]">
          <button 
            onClick={() => setView('home')} 
            className="flex items-center gap-2 border border-[#1e293b] rounded-[8px] px-[16px] py-[10px] text-[12px] font-[800] text-[#64748b] hover:text-white transition-all"
          >
             <ArrowLeft size={14} /> 返回主页
          </button>

          <div className="flex items-center gap-[12px] ml-2">
             <span className="text-[14px] font-[900] text-[#475569]">VEHICLE LAB</span>
             <LucideUserCircle size={40} strokeWidth={1.5} className="text-[#475569] bg-[#1e293b] rounded-full p-1" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-[40px] pb-[40px] flex flex-col gap-[24px] custom-scrollbar">
        {/* KPIs Grid */}
        <div className="flex gap-[20px] w-full">
            <div className="flex-1 bg-[#111827] rounded-[16px] border border-[#1e293b] p-[20px] h-[100px] flex flex-col justify-between">
               <span className="text-[11px] font-[600] text-[#94a3b8]">总计缺陷</span>
               <span className="text-[32px] font-[900] text-[#f8fafc] leading-none">{totalDefects}</span>
            </div>
            <div className="flex-1 bg-[#111827] rounded-[16px] border border-[#1e293b] p-[20px] h-[100px] flex flex-col justify-between">
               <span className="text-[11px] font-[600] text-[#94a3b8]">未解决</span>
               <span className="text-[32px] font-[900] text-[#ef4444] leading-none">{unresolvedCount}</span>
            </div>
            <div className="flex-1 bg-[#111827] rounded-[16px] border border-[#1e293b] p-[20px] h-[100px] flex flex-col justify-between">
               <span className="text-[11px] font-[600] text-[#94a3b8]">处理中</span>
               <span className="text-[32px] font-[900] text-[#eab308] leading-none">{inProgressCount}</span>
            </div>
            <div className="flex-1 bg-[#111827] rounded-[16px] border border-[#1e293b] p-[20px] h-[100px] flex flex-col justify-between">
               <span className="text-[11px] font-[600] text-[#94a3b8]">已解决</span>
               <span className="text-[32px] font-[900] text-[#10b981] leading-none">{resolvedCount}</span>
            </div>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center w-full gap-[20px]">
           <div className="w-[300px] bg-[#111827] border border-[#1e293b] rounded-[8px] py-[10px] px-[16px] flex items-center gap-[8px] focus-within:border-[#3b82f6] transition-colors shrink-0">
              <Search size={16} strokeWidth={2.5} className="text-[#64748b]" />
              <input 
                type="text" 
                placeholder="搜索缺陷..." 
                className="bg-transparent border-none outline-none text-[13px] text-white placeholder:text-[#94a3b8] w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>

           <div className="flex gap-[16px] flex-1 max-w-[400px]">
              <div className="flex-1 bg-[#111827] border border-[#1e293b] rounded-[8px] p-[10px] px-[16px] flex justify-between items-center relative">
                 <select 
                   value={filterStatus}
                   onChange={(e) => setFilterStatus(e.target.value)}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 >
                   <option value="" className="bg-[#111827] text-[#f8fafc]">全部状态</option>
                   {STAGES.map(s => <option key={s.id} value={s.id} className="bg-[#111827] text-[#f8fafc]">{s.label}</option>)}
                 </select>
                 <span className="text-[12px] font-[600] text-[#f8fafc] pointer-events-none">{filterStatus ? STAGES.find(s => s.id === filterStatus)?.label : '全部状态'}</span>
                 <ChevronDown size={14} className="text-[#64748b] pointer-events-none" />
              </div>
              <div className="flex-1 bg-[#111827] border border-[#1e293b] rounded-[8px] p-[10px] px-[16px] flex justify-between items-center relative">
                 <select 
                   value={filterPriority}
                   onChange={(e) => setFilterPriority(e.target.value)}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 >
                   <option value="" className="bg-[#111827] text-[#f8fafc]">所有优先级</option>
                   <option value="high" className="bg-[#111827] text-[#f8fafc]">高优先级(P0/P1)</option>
                   <option value="low" className="bg-[#111827] text-[#f8fafc]">低优先级(P2/P3)</option>
                 </select>
                 <span className="text-[12px] font-[600] text-[#f8fafc] pointer-events-none">{filterPriority === 'high' ? '高优先级(P0/P1)' : filterPriority === 'low' ? '低优先级(P2/P3)' : '所有优先级'}</span>
                 <ChevronDown size={14} className="text-[#64748b] pointer-events-none" />
              </div>
           </div>
        </div>

        {/* PC Table */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-[16px] flex w-full overflow-hidden flex-1 min-h-[300px]">
           <div className="flex-1 overflow-x-auto flex flex-col custom-scrollbar">
             <div className="flex flex-col min-w-[1400px] w-full flex-1 h-full"> 
               <div 
                 className="grid bg-[#0f172a] px-[24px] py-[16px] text-[#94a3b8] text-[11px] font-[800] border-b border-[#1e293b] shrink-0"
                 style={{ gridTemplateColumns: '60px 180px 100px 160px 80px 80px 140px 120px minmax(140px, 1fr) minmax(140px, 1fr) 60px', gap: '12px' }}
               >
                 <div>ID</div>
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
                       <span className="text-[14px] font-[800] text-[#475569] uppercase tracking-widest">暂无缺陷动态</span>
                    </div>
                 ) : (
                    filteredBugs.map((bug, idx) => {
                      const caseDef = casesMap[bug.case_id];
                      const session = sessionsMap[bug.session_id];
                      const currentStatus = STAGES.find(s => s.id === (bug.status || 'Plan')) || STAGES[0];
                      return (
                        <div 
                          key={bug.id || idx} 
                          className="grid px-[24px] py-[14px] items-center hover:bg-[#1e293b]/50 border-b border-[#1e293b] transition-colors"
                          style={{ gridTemplateColumns: '60px 180px 100px 160px 80px 80px 140px 120px minmax(140px, 1fr) minmax(140px, 1fr) 60px', gap: '12px' }}
                        >
                          <div className="text-[12px] font-[800] bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent truncate">#{bug.id || `BUG-${idx + 1024}`}</div>
                          <div className="text-[12px] text-[#cbd5e1] truncate">{session ? `MY${session.model_year} ${session.vehicle_model}` : '-'}</div>
                          <div className="text-[12px] text-[#cbd5e1] truncate">{session?.address || '-'}</div>
                          <div className="text-[11px] font-mono text-[#94a3b8] truncate">{session?.vin || '-'}</div>
                          <div className="text-[12px] text-[#cbd5e1] truncate">{session?.mileage || '-'}</div>
                          <div className="text-[12px] text-[#cbd5e1] truncate">{session?.tester || '-'}</div>
                          <div className="text-[11px] text-[#94a3b8] truncate">{bug.timestamp ? bug.timestamp.split('.')[0] : '-'}</div>
                          <div className="text-[12px] text-[#cbd5e1] truncate">{caseDef?.function_category || caseDef?.category || '-'}</div>
                          <div className="text-[13px] font-[600] text-[#f8fafc] truncate">{caseDef?.function || '-'}</div>
                          <div className="text-[12px] text-[#94a3b8] italic truncate">"{bug.description || ''}"</div>
                          <div className="relative inline-flex items-center justify-center min-w-[70px]">
                            <select 
                              value={bug.status || 'Plan'}
                              onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                              className={`appearance-none w-full rounded-[6px] pl-[8px] pr-[20px] py-[4px] border border-solid text-[10px] font-[800] outline-none cursor-pointer text-center ${currentStatus.bg} ${currentStatus.border} ${currentStatus.color}`}
                            >
                              {STAGES.map(s => (
                                <option key={s.id} value={s.id} className="bg-[#111827] text-slate-100">{s.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className={`absolute right-[6px] pointer-events-none ${currentStatus.color}`} />
                          </div>
                        </div>
                      );
                    })
                 )}
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
