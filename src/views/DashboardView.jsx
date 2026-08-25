import React, { useEffect, useState } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TerminalSquare, UserCircle as LucideUserCircle, TrendingUp as LucideTrendingUp, CheckCircle2, BadgeCheck, XCircle, Car, BarChart3, AlertTriangle, Bug, ArrowLeft, Gauge, Sun, Moon, QrCode } from 'lucide-react';
import { FIELD_LABELS } from '../constants/labels.js';
import { useTheme } from '../hooks/useTheme.js';
import MobileNavigator from '../components/MobileNavigator.jsx';

export default function DashboardView({ API_BASE, cases, bugs, historySessions, topFailed, setView, setDefectsTargetSessionId, onOpenQrModal }) {
  const { theme, toggleTheme } = useTheme();
  const [casesMap, setCasesMap] = useState({});

  // Aggregated States
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalCases: 0,
    totalPassed: 0,
    totalFailed: 0,
  });

  const [dailyData, setDailyData] = useState([]);
  const [modelData, setModelData] = useState([]);

  // Drill-down States
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelSessions, setModelSessions] = useState([]);

  // Responsive UI state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Process Local Injected Data Instantly
    const cMap = {};
    if (Array.isArray(cases)) {
      cases.forEach(c => {
        cMap[c.id] = c;
      });
    }
    setCasesMap(cMap);

    // Process stats using historySessions prop directly
    processStats(historySessions);
  }, [cases, historySessions]);

  const processStats = (sessions) => {
    let tSessions = sessions.length;
    let tCases = 0;
    let tPassed = 0;
    let tFailed = 0;

    const dailyMap = {};
    const modelMap = {};

    sessions.forEach(s => {
      const pCount = parseInt(s.pass_count) || 0;
      const fCount = parseInt(s.fail_count) || 0;
      const tCount = pCount + fCount;

      tCases += tCount;
      tPassed += pCount;
      tFailed += fCount;

      const dateKey = s.timestamp ? s.timestamp.substring(5, 10).replace('-', '/') : 'Unknown';
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, total: 0, passed: 0, failed: 0 };
      }
      dailyMap[dateKey].total += tCount;
      dailyMap[dateKey].passed += pCount;
      dailyMap[dateKey].failed += fCount;

      const vKey = s.vehicle_model || 'Unknown';
      if (!modelMap[vKey]) {
        modelMap[vKey] = { model: vKey, total: 0, passed: 0, failed: 0 };
      }
      modelMap[vKey].total += tCount;
      modelMap[vKey].passed += pCount;
      modelMap[vKey].failed += fCount;
    });

    setStats({
      totalSessions: tSessions,
      totalCases: tCases,
      totalPassed: tPassed,
      totalFailed: tFailed,
    });

    const sortedDaily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    setDailyData(sortedDaily.slice(-7)); // Last 7 days

    const pModelStats = Object.values(modelMap).map(m => {
      let rate = 0;
      if (m.total > 0) rate = (m.passed / m.total) * 100;
      return { 
        ...m, 
        passRate: parseFloat(rate.toFixed(1))
      };
    }).sort((a, b) => b.total - a.total); 
    
    setModelData(pModelStats);
  };

  const handleBarClick = (historySessionsParams) => {
    let clickedModel = null;
    if (historySessionsParams && historySessionsParams.model) {
      clickedModel = historySessionsParams.model; // Active payload directly from <Bar> onClick
    } else if (historySessionsParams && historySessionsParams.activePayload && historySessionsParams.activePayload.length > 0) {
      clickedModel = historySessionsParams.activePayload[0].payload.model;
    } else if (historySessionsParams && historySessionsParams.activeLabel) {
      clickedModel = historySessionsParams.activeLabel;
    }

    if (clickedModel) {
      const filtered = historySessions.filter(s => s.vehicle_model === clickedModel);
      filtered.sort((a, b) => new Date(String(b.timestamp || 0).replace(/-/g, '/')) - new Date(String(a.timestamp || 0).replace(/-/g, '/')));
      setSelectedModel(clickedModel);
      setModelSessions(filtered);
    }
  };



  const overallPassRate = stats.totalCases > 0 
    ? ((stats.totalPassed / stats.totalCases) * 100).toFixed(1) 
    : '0.0';

  if (selectedModel) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] text-slate-800 dark:text-slate-100 font-sans px-[24px] pt-[44px] pb-[100px] overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <header className="mb-6 flex justify-between items-center pb-4 border-b border-slate-200 dark:border-[#334155]">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedModel(null)} 
                className="p-2 sm:p-3 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-[12px] text-[#60a5fa] hover:text-slate-900 dark:text-white transition-all active:scale-95 flex items-center gap-2 font-[900] text-[10px] tracking-widest"
              >
              <ArrowLeft size={16} /> 返回上页
            </button>
            <div className="flex flex-col ml-1">
              <h1 className="text-[20px] font-[900] italic tracking-tighter uppercase leading-none bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent">
                {selectedModel} <span className="text-slate-900 dark:text-white">测试记录</span>
              </h1>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-[16px]">
          {modelSessions.map((session, idx) => {
            const execCount = parseInt(session.case_count) || 0;
            const passCount = parseInt(session.pass_count) || 0;
            const passFailCount = parseInt(session.pass_fail_count) || 0;
            const totalCases = cases ? cases.length : 0;
            const passRate = passFailCount > 0 ? ((passCount / passFailCount) * 100).toFixed(0) : 0;
            const sessionBugs = Array.isArray(bugs) ? bugs.filter(b => String(b.session_id) === String(session.id)) : [];
            const bugCount = sessionBugs.length;

            const handleCardClick = () => {
              if (setDefectsTargetSessionId) setDefectsTargetSessionId(session.id);
              setView('pdca');
            };

            return (
              <div 
                key={session.id || idx} 
                onClick={handleCardClick}
                className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[20px] p-[14px] flex flex-col gap-[10px] cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all active:scale-[0.99] group"
              >
                {/* Top Row */}
                <div className="flex justify-between items-center w-full">
                   <div className="flex gap-[8px] items-center">
                      <span className="text-[11px] font-[600] text-[#3b82f6]">
                         {session.timestamp ? String(session.timestamp).substring(0, 16).replace(/-/g, '/') : ''}
                      </span>
                   </div>
                   <span className="text-[11px] font-[normal] text-[#64748b]">{totalCases} 样例</span>
                </div>

                {/* Title Row */}
                <div className="flex justify-between items-center w-full">
                   <span className="text-[22px] font-[900] text-slate-900 dark:text-white italic group-hover:text-blue-500 transition-colors">
                      {session.model_year ? `MY${session.model_year}` : ''} {session.vehicle_model || 'Unknown'}
                   </span>
                </div>

                {/* Info Row */}
                <div className="flex gap-[12px] items-center w-full">
                   <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none rounded-[10px] w-[36px] h-[36px] flex items-center justify-center shrink-0">
                      <Car size={18} className="text-[#64748b]" />
                   </div>
                   <div className="flex flex-col gap-[2px] min-w-0 flex-1">
                      <span className="text-[12px] font-[normal] text-slate-700 dark:text-[#cbd5e1] truncate">VIN: {session.vin || 'N/A'}</span>
                      <span className="text-[11px] font-[normal] text-[#64748b] truncate">
                         {(session.vehicle_architecture || session.architecture) || 'N/A'} • {session.test_location || session.address || 'N/A'} • {session.tester || 'N/A'}
                      </span>
                   </div>
                </div>

                {/* Bottom Row */}
                <div className="flex justify-between items-center w-full pt-[4px]">
                   <div className="flex gap-[8px] items-center">
                      <span className={`text-[13px] font-[bold] ${passRate >= 90 ? 'text-[#22c55e]' : (passRate >= 60 ? 'text-[#eab308]' : 'text-[#ef4444]')}`}>
                         通过 {passRate}%
                      </span>
                      <span className="text-[13px] font-[bold] text-[#64748b]">已执行 {execCount} 条用例</span>
                   </div>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       handleCardClick();
                     }}
                     className="h-[32px] px-[12px] bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-[10px] flex items-center gap-[6px] text-[12px] font-[800] transition-all active:scale-95 cursor-pointer"
                   >
                     <Bug size={14} />
                     <span>缺陷 ({bugCount})</span>
                   </button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    );
  }

  const renderMobile = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <header className="px-[16px] pt-[44px] pb-[8px] flex justify-between items-center w-full z-10 shrink-0">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[26px] font-[800] text-slate-900 dark:text-white leading-none tracking-tight">仪表面板</span>
        </div>
        <button
          onClick={onOpenQrModal}
          title="微信扫一扫访问"
          className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center active:scale-95 transition-transform"
        >
          <QrCode size={20} strokeWidth={2} />
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto px-[16px] pt-[16px] pb-[100px] flex flex-col gap-[16px] custom-scrollbar">
        {/* KPI Row 1 */}
        <div className="flex gap-[12px] w-full">
          <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[14px] border border-slate-200 dark:border-[#334155] p-[16px] h-[86px] flex flex-col justify-between">
            <div className="flex justify-between items-center w-full">
               <span className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">总场次</span>
               <LucideTrendingUp size={14} strokeWidth={3} className="text-[#3b82f6]" />
            </div>
            <span className="text-[28px] font-[900] text-slate-900 dark:text-[#f8fafc] leading-none">{stats.totalSessions}</span>
          </div>
          <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[14px] border border-slate-200 dark:border-[#334155] p-[16px] h-[86px] flex flex-col justify-between">
            <div className="flex justify-between items-center w-full">
               <span className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">全局通过率</span>
               <CheckCircle2 size={14} strokeWidth={3} className="text-[#10b981]" />
            </div>
            <div className="flex items-end gap-[2px]">
               <span className="text-[28px] font-[900] text-[#10b981] leading-none">{overallPassRate}</span>
               <span className="text-[13px] font-[900] text-[#10b981]/50 leading-none mb-[2px]">%</span>
            </div>
          </div>
        </div>

        {/* KPI Row 2 */}
        <div className="flex gap-[12px] w-full">
          <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[14px] border border-slate-200 dark:border-[#334155] p-[16px] h-[86px] flex flex-col justify-between">
            <div className="flex justify-between items-center w-full">
               <span className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">通过用例</span>
               <BadgeCheck size={14} strokeWidth={3} className="text-[#60a5fa]" />
            </div>
            <div className="flex items-end gap-[4px]">
               <span className="text-[28px] font-[900] text-slate-900 dark:text-[#f8fafc] leading-none">{stats.totalPassed}</span>
               <span className="text-[12px] font-[800] text-slate-500 dark:text-[#94a3b8] leading-none mb-[4px]">/ {stats.totalCases}</span>
            </div>
          </div>
          <div className="flex-1 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[14px] border border-slate-200 dark:border-[#334155] p-[16px] h-[86px] flex flex-col justify-between">
            <div className="flex justify-between items-center w-full">
               <span className="text-[12px] font-[900] text-slate-500 dark:text-[#cbd5e1]">失败用例</span>
               <XCircle size={14} strokeWidth={3} className="text-[#f59e0b]" />
            </div>
            <span className="text-[28px] font-[900] text-[#f59e0b] leading-none">{stats.totalFailed}</span>
          </div>
        </div>

        {/* Model Pass Rate */}
        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[14px] border border-slate-200 dark:border-[#334155] p-[16px] flex flex-col gap-[12px]">
          <div className="flex justify-between items-center w-full">
             <div className="flex items-center gap-[6px]">
                <Car size={14} strokeWidth={2.5} className="text-[#3b82f6]" />
                <span className="text-[11px] font-[900] text-slate-700 dark:text-[#e2e8f0] italic">各车型通过率对比</span>
             </div>
             <span className="text-[8px] font-[800] text-[#3b82f6]/60 tracking-wider">点击下钻</span>
          </div>
          <div className="flex flex-col gap-[12px] w-full mt-[4px]">
             {modelData.length > 0 ? modelData.map((m, i) => (
                 <div key={i} className="flex flex-col gap-[6px] w-full cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleBarClick({ model: m.model })}>
                     <div className="flex justify-between items-end">
                         <span className="text-[11px] font-[800] text-slate-700 dark:text-[#cbd5e1]">{m.model}</span>
                         <div className="flex gap-[6px] items-center">
                           <span className="text-[9px] font-[600] text-slate-400 dark:text-slate-500">{m.passed} / {m.total}</span>
                           <span className="text-[12px] font-[900] text-slate-900 dark:text-white">{m.passRate}%</span>
                         </div>
                     </div>
                     <div className="w-full h-[6px] bg-slate-100 dark:bg-[#0f172a] rounded-full overflow-hidden border border-slate-200/50 dark:border-[#334155]/30">
                         <div className="h-full bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] rounded-full transition-all duration-1000 ease-out" style={{ width: `${m.passRate}%` }} />
                     </div>
                 </div>
             )) : (
                 <div className="text-[10px] font-[800] text-slate-500 dark:text-[#cbd5e1] text-center py-4">暂无数据</div>
             )}
          </div>
        </div>

        {/* Daily Volume */}
        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[14px] border border-slate-200 dark:border-[#334155] p-[16px] flex flex-col gap-[12px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-[6px]">
              <BarChart3 size={14} strokeWidth={2.5} className="text-[#3b82f6]" />
              <span className="text-[11px] font-[900] text-slate-700 dark:text-[#e2e8f0] italic">每日测试量趋势</span>
            </div>
            <div className="flex items-center gap-[12px]">
              <div className="flex items-center gap-[5px]">
                 <div className="w-[7px] h-[7px] bg-[#3b82f6] rounded-full"></div>
                 <span className="text-[9px] font-[700] text-slate-500 dark:text-[#cbd5e1]">通过</span>
              </div>
              <div className="flex items-center gap-[5px]">
                 <div className="w-[7px] h-[7px] bg-[#f59e0b] rounded-full"></div>
                 <span className="text-[9px] font-[700] text-slate-500 dark:text-[#cbd5e1]">未通过</span>
              </div>
            </div>
          </div>
          <div className="h-[110px] w-full mt-[4px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(59,130,246,0.08)' }}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ color: '#64748b', fontWeight: 800 }}
                />
                <Bar dataKey="passed" stackId="a" fill="#3b82f6" barSize={12} radius={[0, 0, 2, 2]} label={{ position: 'center', fill: '#fff', fontSize: 8, fontWeight: 800, formatter: (v) => v > 0 ? v : '' }} />
                <Bar dataKey="failed" stackId="a" fill="#f59e0b" barSize={12} radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#64748b', fontSize: 9, fontWeight: 800, formatter: (v) => v > 0 ? v : '' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Failed */}
        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[14px] border border-slate-200 dark:border-[#334155] p-[16px] flex flex-col gap-[10px]">
          <div className="flex items-center gap-[6px] mb-[4px]">
             <AlertTriangle size={14} strokeWidth={2.5} className="text-[#f59e0b]" />
             <span className="text-[11px] font-[900] text-[#f59e0b] italic">高频失败用例</span>
          </div>
          
          {topFailed.length > 0 ? topFailed.slice(0, 3).map((tf, i) => {
             const caseDef = casesMap[tf.case_id] || tf;
             return (
             <div key={tf.case_id || i} className="bg-slate-100 dark:bg-[#334155] border border-slate-200 dark:border-[#334155]/50 rounded-[8px] p-[10px] px-[12px] flex justify-between items-center">
                <div className="flex flex-col gap-[2px] flex-1 min-w-0 pr-2">
                   <span className="text-[10px] font-[900] text-slate-900 dark:text-white truncate">{caseDef.function_category || caseDef.functionCategory || 'Unknown'} &gt; {caseDef.function || 'Unknown'}</span>
                   <span className="text-[9px] font-[600] text-slate-500 dark:text-[#cbd5e1] truncate">{caseDef.expected || caseDef.content || '...'}</span>
                </div>
                <div className="bg-[#f59e0b]/10 rounded-[5px] px-[6px] py-[3px] shrink-0">
                   <span className="text-[9px] font-[900] text-[#f59e0b]">{tf.fail_count}次</span>
                </div>
             </div>
             );
          }) : (
            <div className="text-[10px] font-[800] text-slate-500 dark:text-[#cbd5e1] text-center py-4">暂无失败用例</div>
          )}
        </div>

        {/* Recent Defects */}
        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[14px] border border-slate-200 dark:border-[#334155] p-[16px] flex flex-col gap-[10px]">
           <div className="flex items-center gap-[6px] mb-[4px]">
             <Bug size={14} strokeWidth={2.5} className="text-[#ef4444]" />
             <span className="text-[11px] font-[900] text-[#ef4444] italic">最新缺陷动态</span>
           </div>

           {bugs.length > 0 ? bugs.slice(0, 2).map((bug, i) => {
             const linkedCase = casesMap[bug.case_id];
             return (
               <div key={bug.id || i} className="flex gap-[8px] w-full">
                  <div className="w-[2px] bg-[#ef4444] rounded-[2px]" />
                  <div className="flex flex-col gap-[3px] w-full min-w-0">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-[900] text-slate-900 dark:text-white truncate">{(bug.function_category || linkedCase?.function_category || linkedCase?.category || 'Unknown')} &gt; {(bug.function || linkedCase?.function || `Case ${bug.case_id}`)}</span>
                      <span className="text-[8px] font-[800] text-slate-500 dark:text-[#cbd5e1] shrink-0">{bug.timestamp?.substring(0, 16).replace(/-/g, '/')}</span>
                    </div>
                    <span className="text-[9px] font-[600] text-slate-500 dark:text-[#cbd5e1] truncate w-full">"{bug.description}"</span>
                  </div>
               </div>
             )
           }) : (
             <div className="text-[10px] font-[800] text-slate-500 dark:text-[#cbd5e1] text-center py-4">暂无缺陷动态</div>
           )}
        </div>

      </main>

      <MobileNavigator activeTab="dashboard" setView={setView} />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );

  const renderPC = () => (
    <div className="h-screen bg-slate-50 dark:bg-[#0f1523] text-slate-800 dark:text-slate-100 flex flex-col font-sans overflow-hidden">
      <header className="px-[40px] pt-[24px] pb-[24px] flex justify-between items-center w-full z-10 shrink-0">
        <div className="flex items-center gap-[16px]">
          <Gauge size={28} strokeWidth={2} className="text-[#3b82f6]" />
          <div className="flex flex-col gap-[2px]">
            <span className="text-[24px] font-[900] text-slate-900 dark:text-white leading-none tracking-tight italic">仪表面板</span>
            <span className="text-[10px] font-[800] text-[#64748b]">测试质量与数据洞察</span>
          </div>
        </div>
        <div className="flex items-center gap-[16px]">
          <button 
            onClick={onOpenQrModal} 
            title="微信扫一扫访问 / 手机端录入"
            className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-[8px] px-[14px] py-[10px] text-[12px] font-[800] transition-all shadow-sm active:scale-95"
          >
             <QrCode size={15} strokeWidth={2.2} /> 微信扫码
          </button>

          <button 
            onClick={() => setView('home')} 
            className="flex items-center gap-2 border border-slate-200 dark:border-[#334155] rounded-[8px] px-[16px] py-[10px] text-[12px] font-[800] text-[#64748b] hover:text-slate-900 dark:text-white transition-all"
          >
             <ArrowLeft size={14} /> 返回主页
          </button>
          
          <div className="flex items-center gap-[12px]">
             <span className="text-[14px] font-[900] text-slate-500 dark:text-[#cbd5e1]">VEHICLE LAB</span>
             <LucideUserCircle size={32} strokeWidth={1.5} className="text-slate-500 dark:text-[#cbd5e1]" />
          </div>

          <button 
            onClick={() => setView('monitor')}
            className="border border-slate-200 dark:border-[#334155] rounded-[8px] w-[40px] h-[40px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none transition-all group"
          >
             <TerminalSquare size={18} strokeWidth={2} className="text-[#64748b] group-hover:text-slate-900 dark:text-white" />
          </button>
          
          <button 
            onClick={toggleTheme}
            className="border border-slate-200 dark:border-[#334155] rounded-[8px] w-[40px] h-[40px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#1e293b] shadow-sm dark:shadow-none transition-all"
          >
            {theme === 'dark' ? <Sun size={18} strokeWidth={2} className="text-[#64748b] dark:text-white" /> : <Moon size={18} strokeWidth={2} className="text-[#64748b]" />}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden px-[40px] pb-[24px] flex flex-col gap-[20px] min-h-0">
        {/* KPI Row */}
        <div className="grid grid-cols-[1fr_400px] gap-[20px] w-full">
          <div className="grid grid-cols-3 gap-[20px]">
            <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[20px] h-[100px] flex flex-col justify-between">
              <div className="flex justify-between items-center w-full">
                 <span className="text-[13px] font-[900] text-slate-500 dark:text-[#cbd5e1]">总测试场次</span>
                 <LucideTrendingUp size={18} strokeWidth={3} className="text-[#3b82f6]" />
              </div>
              <span className="text-[32px] font-[900] text-slate-900 dark:text-[#f8fafc] leading-none">{stats.totalSessions}</span>
            </div>
            <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[20px] h-[100px] flex flex-col justify-between">
              <div className="flex justify-between items-center w-full">
                 <span className="text-[13px] font-[900] text-slate-500 dark:text-[#cbd5e1]">全局通过率</span>
                 <CheckCircle2 size={18} strokeWidth={3} className="text-[#10b981]" />
              </div>
              <div className="flex items-end gap-[4px]">
                 <span className="text-[32px] font-[900] text-[#10b981] leading-none">{overallPassRate}</span>
                 <span className="text-[16px] font-[900] text-[#10b981]/50 leading-none mb-[2px]">%</span>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[20px] h-[100px] flex flex-col justify-between">
              <div className="flex justify-between items-center w-full">
                 <span className="text-[13px] font-[900] text-slate-500 dark:text-[#cbd5e1]">通过用例数</span>
                 <BadgeCheck size={18} strokeWidth={3} className="text-[#60a5fa]" />
              </div>
              <div className="flex items-end gap-[6px]">
                 <span className="text-[32px] font-[900] text-slate-900 dark:text-[#f8fafc] leading-none">{stats.totalPassed}</span>
                 <span className="text-[14px] font-[800] text-slate-500 dark:text-[#94a3b8] leading-none mb-[4px]">/ {stats.totalCases}</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[20px] h-[100px] flex flex-col justify-between">
            <div className="flex justify-between items-center w-full">
               <span className="text-[13px] font-[900] text-slate-500 dark:text-[#cbd5e1]">失败用例数</span>
               <XCircle size={18} strokeWidth={3} className="text-[#f59e0b]" />
            </div>
            <span className="text-[32px] font-[900] text-[#f59e0b] leading-none">{stats.totalFailed}</span>
          </div>
        </div>

        {/* Main Row */}
        <div className="flex-1 grid grid-cols-[1fr_400px] gap-[20px] w-full min-h-0">
          {/* Left Column */}
          <div className="grid grid-rows-2 gap-[20px] min-w-0 min-h-0">
            {/* Model Pass Rate */}
            <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[24px] flex flex-col gap-[16px] min-h-0 min-w-0">
              <div className="flex justify-between items-center w-full">
                 <div className="flex items-center gap-[8px]">
                    <Car size={16} strokeWidth={2.5} className="text-[#3b82f6]" />
                    <span className="text-[12px] font-[900] text-slate-700 dark:text-[#e2e8f0] italic">各车型通过率对比</span>
                 </div>
                 <span className="text-[10px] font-[800] text-[#3b82f6]/60 tracking-wider">点击下钻</span>
              </div>
              <div className="flex-1 flex flex-col gap-[16px] w-full mt-[8px] overflow-y-auto custom-scrollbar pr-[8px]">
                 {modelData.length > 0 ? modelData.map((m, i) => (
                     <div key={i} className="flex flex-col gap-[8px] w-full cursor-pointer group" onClick={() => handleBarClick({ model: m.model })}>
                         <div className="flex justify-between items-end">
                             <span className="text-[12px] font-[800] text-slate-700 dark:text-[#cbd5e1] group-hover:text-[#3b82f6] transition-colors">{m.model}</span>
                             <div className="flex gap-[8px] items-center">
                               <span className="text-[10px] font-[600] text-slate-400 dark:text-slate-500">{m.passed} / {m.total}</span>
                               <span className="text-[14px] font-[900] text-slate-900 dark:text-white">{m.passRate}%</span>
                             </div>
                         </div>
                         <div className="w-full h-[8px] bg-slate-100 dark:bg-[#0f172a] rounded-full overflow-hidden border border-slate-200/50 dark:border-[#334155]/30">
                             <div className="h-full bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(56,189,248,0.4)]" style={{ width: `${m.passRate}%` }} />
                         </div>
                     </div>
                 )) : (
                     <div className="text-[12px] font-[800] text-slate-500 dark:text-[#cbd5e1] text-center py-8">暂无数据</div>
                 )}
              </div>
            </div>

            {/* Daily Volume */}
            <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[24px] flex flex-col gap-[16px] min-h-0 min-w-0">
              <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-[8px]">
                    <BarChart3 size={16} strokeWidth={2.5} className="text-[#3b82f6]" />
                    <span className="text-[12px] font-[900] text-slate-700 dark:text-[#e2e8f0] italic">每日测试量趋势</span>
                  </div>
                  <div className="flex items-center gap-[16px]">
                    <div className="flex items-center gap-[6px]">
                       <div className="w-[8px] h-[8px] bg-[#3b82f6] rounded-full"></div>
                       <span className="text-[10px] font-[700] text-slate-500 dark:text-[#cbd5e1]">通过</span>
                    </div>
                    <div className="flex items-center gap-[6px]">
                       <div className="w-[8px] h-[8px] bg-[#f59e0b] rounded-full"></div>
                       <span className="text-[10px] font-[700] text-slate-500 dark:text-[#cbd5e1]">未通过</span>
                    </div>
                  </div>
              </div>
              <div className="flex-1 w-full mt-[8px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(59,130,246,0.08)' }}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelStyle={{ color: '#64748b', fontWeight: 800 }}
                    />
                    <Bar dataKey="passed" stackId="a" fill="#3b82f6" barSize={16} radius={[0, 0, 4, 4]} label={{ position: 'center', fill: '#fff', fontSize: 10, fontWeight: 800, formatter: (v) => v > 0 ? v : '' }} />
                    <Bar dataKey="failed" stackId="a" fill="#f59e0b" barSize={16} radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#64748b', fontSize: 11, fontWeight: 800, formatter: (v) => v > 0 ? v : '' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="grid grid-rows-2 gap-[20px] min-w-0 min-h-0">
            {/* Top Failed */}
            <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[24px] flex flex-col gap-[12px] min-h-0 min-w-0">
              <div className="flex items-center gap-[8px] mb-[8px]">
                 <AlertTriangle size={16} strokeWidth={2.5} className="text-[#f59e0b]" />
                 <span className="text-[12px] font-[900] text-[#f59e0b] italic">高频失败用例</span>
              </div>
              
              <div className="flex-1 flex flex-col gap-[8px] overflow-y-auto custom-scrollbar">
              {topFailed.length > 0 ? topFailed.slice(0, 4).map((tf, i) => {
                 const caseDef = casesMap[tf.case_id] || tf;
                 return (
                 <div key={tf.case_id || i} className="bg-slate-100 dark:bg-[#334155] border border-slate-200 dark:border-[#334155]/50 rounded-[10px] p-[12px] px-[14px] flex justify-between items-center">
                    <div className="flex flex-col gap-[4px] flex-1 min-w-0 pr-3">
                       <span className="text-[11px] font-[900] text-slate-900 dark:text-white truncate">{caseDef.function_category || caseDef.functionCategory || 'Unknown'} &gt; {caseDef.function || 'Unknown'}</span>
                       <span className="text-[10.5px] font-[600] text-slate-500 dark:text-[#cbd5e1] truncate">{caseDef.expected || caseDef.content || '...'}</span>
                    </div>
                    <div className="bg-[#f59e0b]/10 rounded-[6px] px-[8px] py-[4px] shrink-0">
                       <span className="text-[10px] font-[900] text-[#f59e0b]">{tf.fail_count}次</span>
                    </div>
                 </div>
                 );
              }) : (
                <div className="text-[12px] font-[800] text-slate-500 dark:text-[#cbd5e1] text-center py-4">暂无失败用例</div>
              )}
              </div>
            </div>

            {/* Recent Defects */}
            <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-[#334155] rounded-[16px] border border-slate-200 dark:border-[#334155] p-[24px] flex flex-col gap-[12px] min-h-0 min-w-0">
               <div className="flex items-center gap-[8px] mb-[8px]">
                 <Bug size={16} strokeWidth={2.5} className="text-[#ef4444]" />
                 <span className="text-[12px] font-[900] text-[#ef4444] italic">最新缺陷动态</span>
               </div>

               <div className="flex-1 flex flex-col gap-[16px] overflow-y-auto pr-[4px]">
               {bugs.length > 0 ? bugs.slice(0, 4).map((bug, i) => {
                 const linkedCase = casesMap[bug.case_id];
                 return (
                   <div key={bug.id || i} className="flex gap-[12px] w-full items-start">
                      <div className="w-[3px] bg-[#ef4444] rounded-[3px] self-stretch mt-1 mb-1 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                      <div className="flex flex-col gap-[4px] w-full min-w-0">
                        <div className="flex justify-between items-baseline w-full">
                          <span className="text-[11px] font-[900] text-slate-900 dark:text-[#f8fafc] truncate">{(bug.function_category || linkedCase?.function_category || linkedCase?.category || 'Unknown')} &gt; {(bug.function || linkedCase?.function || `Case ${bug.case_id}`)}</span>
                          <span className="text-[10px] font-[800] text-[#64748b] shrink-0 ml-2">{bug.timestamp?.substring(0, 16).replace(/-/g, '/')}</span>
                        </div>
                        <span className="text-[10.5px] font-[600] text-slate-500 dark:text-[#cbd5e1] break-words line-clamp-2 leading-snug">"{bug.description}"</span>
                      </div>
                   </div>
                 )
               }) : (
                 <div className="text-[12px] font-[800] text-slate-500 dark:text-[#cbd5e1] text-center py-4">暂无缺陷动态</div>
               )}
               </div>
            </div>
          </div>
        </div>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>
      </main>
    </div>
  );

  return isMobile ? renderMobile() : renderPC();
}
