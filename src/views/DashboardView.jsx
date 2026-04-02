import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeft, CheckCircle2, XCircle, LayoutDashboard, Activity, Car, Users, Calendar, MapPin, AlertTriangle, Bug } from 'lucide-react';
import { FIELD_LABELS } from '../constants/labels.js';

export default function DashboardView({ API_BASE, setView }) {
  const [data, setData] = useState([]);
  const [bugsData, setBugsData] = useState([]);
  const [casesMap, setCasesMap] = useState({});
  const [topFailed, setTopFailed] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/test-sessions`).then(res => res.json()),
      fetch(`${API_BASE}/bugs`).then(res => res.json()),
      fetch(`${API_BASE}/cases`).then(res => res.json()),
      fetch(`${API_BASE}/cases/top-fails`).then(res => res.json())
    ])
      .then(([sessionData, bugs, casesData, topFailsData]) => {
        // 1. Map Cases
        const cMap = {};
        if (Array.isArray(casesData)) {
          casesData.forEach(c => {
            cMap[c.id] = c;
          });
        }
        setCasesMap(cMap);

        // 2. Process Bugs
        if (Array.isArray(bugs)) {
          bugs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          setBugsData(bugs);
        }

        // 3. Process Top Fails
        if (Array.isArray(topFailsData)) {
          setTopFailed(topFailsData);
        }

        // 4. Process Sessions
        if (Array.isArray(sessionData)) {
          setData(sessionData);
          processStats(sessionData);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard data', err);
        setLoading(false);
      });
  }, [API_BASE]);

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
      const tCount = pCount + fCount; // Only Pass and Fail count towards total completion rate. Ignore N/A and unexecuted.

      tCases += tCount;
      tPassed += pCount;
      tFailed += fCount;

      const dateKey = s.timestamp ? s.timestamp.substring(0, 10) : 'Unknown';
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
    setDailyData(sortedDaily);

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

  const handleBarClick = (dataParams) => {
    let clickedModel = null;
    if (dataParams && dataParams.activePayload && dataParams.activePayload.length > 0) {
      clickedModel = dataParams.activePayload[0].payload.model;
    } else if (dataParams && dataParams.model) {
      clickedModel = dataParams.model;
    } else if (dataParams && dataParams.payload && dataParams.payload.model) {
      clickedModel = dataParams.payload.model;
    }

    if (clickedModel) {
      const filtered = data.filter(s => s.vehicle_model === clickedModel);
      filtered.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      setSelectedModel(clickedModel);
      setModelSessions(filtered);
    }
  };

  // No longer deriving Top Failed Cases from bugs data

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const overallPassRate = stats.totalCases > 0 
    ? ((stats.totalPassed / stats.totalCases) * 100).toFixed(1) 
    : 0;

  // --- DRILL DOWN VIEW ---
  if (selectedModel) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 overflow-y-auto">
        <header className="mb-6 flex justify-between items-center pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedModel(null)} 
              className="p-2 sm:p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 hover:text-white transition-all active:scale-95 flex items-center gap-2 font-black text-[10px] sm:text-xs tracking-widest"
            >
              <ArrowLeft size={16} /> GLOBAL VIEW
            </button>
            <div className="flex flex-col ml-1 sm:ml-4">
              <h1 className="text-lg sm:text-3xl font-black italic tracking-tighter uppercase leading-none text-blue-400">
                {selectedModel} <span className="text-white">{FIELD_LABELS.sessionTitle.split(' / ')[1]}</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                Detailed Execution History
              </p>
            </div>
          </div>
          <Car className="text-blue-500 opacity-20 hidden sm:block" size={32} />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modelSessions.map((session, idx) => {
            const passed = parseInt(session.pass_count) || 0;
            const failed = parseInt(session.fail_count) || 0;
            const total = passed + failed; // Exclude N/A
            const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : "0.0";
            const isPerfect = rate === "100.0";
            const isCritical = parseFloat(rate) < 50.0;

            return (
              <div key={session.id || idx} className={`automotive-card p-5 relative overflow-hidden group ${isCritical ? 'border-rose-500/30 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]' : ''}`}>
                {isPerfect && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full flex items-start justify-end p-3 pointer-events-none">
                    <CheckCircle2 size={16} className="text-emerald-500/50" />
                  </div>
                )}
                {isCritical && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full flex items-start justify-end p-3 pointer-events-none animate-pulse">
                    <AlertTriangle size={16} className="text-rose-500/60" />
                  </div>
                )}
                <div className="mb-5">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xl font-black uppercase italic tracking-tighter mb-1 mt-1 text-slate-200">
                      ID: {session.id}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                    <Calendar size={12} />
                    {session.timestamp ? new Date(session.timestamp).toLocaleString() : 'Unknown Date'}
                  </div>
                </div>

                <div className="space-y-3 mb-6 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                    <Users size={14} className="text-blue-500" />
                    {FIELD_LABELS.tester.split(' / ')[0]}: <span className="text-white">{session.tester || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400 truncate">
                    <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                    {FIELD_LABELS.address.split(' / ')[0]}: <span className="text-white truncate">{session.address || 'N/A'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                  <div className="flex gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-black uppercase mb-1">Pass</span>
                      <span className="text-xl font-black text-emerald-500 leading-none">{passed}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-black uppercase mb-1">Fail</span>
                      <span className="text-xl font-black text-amber-500 leading-none">{failed}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase mb-1 ${isCritical ? 'text-rose-500 pt-1' : 'text-slate-500'}`}>
                      {isCritical ? '严重警告 / CRITICAL WARN' : '通过率 / Pass Rate'}
                    </span>
                    <span className={`text-2xl leading-none font-black ${isPerfect ? 'text-emerald-500' : isCritical ? 'text-rose-500 animate-pulse' : 'text-blue-400'}`}>
                      {rate}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {modelSessions.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 font-bold uppercase tracking-widest border border-dashed border-slate-800 rounded-2xl">
              No detailed sessions found for this model.
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- GLOBAL DASHBOARD (UX Optimized 3-Column Layout) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 overflow-y-auto">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('home')} 
            className="p-2 sm:p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-3xl font-black italic tracking-tighter uppercase leading-none">
              Command <span className="text-blue-500">Center</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
              Test Quality & Insights
            </p>
          </div>
        </div>
        <LayoutDashboard className="text-blue-500 opacity-20" size={32} />
      </header>

      {/* KPI Cards (Strategic Layer) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="automotive-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{FIELD_LABELS.sessionTitle.split(' / ')[1]}s</span>
            <Activity size={16} className="text-blue-500" />
          </div>
          <span className="text-2xl font-black">{stats.totalSessions}</span>
        </div>

        <div className="automotive-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{FIELD_LABELS.globalPassRate}</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-black text-emerald-500">{overallPassRate}</span>
            <span className="text-xs font-bold text-emerald-500/50 mb-1">%</span>
          </div>
        </div>

        <div className="automotive-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{FIELD_LABELS.casesPassed}</span>
            <CheckCircle2 size={16} className="text-blue-400" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black">{stats.totalPassed}</span>
            <span className="text-[10px] font-bold text-slate-600 mb-1">/ {stats.totalCases}</span>
          </div>
        </div>

        <div className="automotive-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{FIELD_LABELS.casesFailed}</span>
            <XCircle size={16} className="text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-500">{stats.totalFailed}</span>
        </div>
      </div>

      {/* Main Grid: 2 Columns for Charts (Strategic), 1 Column for Insights (Actionable) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
        
        {/* Left Area (Strategic Charts) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Model Pass Rate Comparison */}
          <div className="automotive-card p-5 sm:p-6 w-full">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Car size={16} className="text-blue-500" />
                <h3 className="text-sm font-black italic tracking-tighter uppercase text-slate-200">{FIELD_LABELS.modelPassRateComparison}</h3>
              </div>
              <span className="text-[9px] text-blue-500/50 font-bold uppercase tracking-widest animate-pulse hidden sm:block">
                {FIELD_LABELS.clickBarToDrillDown}
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart onClick={handleBarClick} data={modelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="model" stroke="#475569" tick={{fill: '#64748b', fontSize: 10}} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{fill: '#64748b', fontSize: 10}} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#0f172a', opacity: 0.5}}
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '1rem', padding: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '900' }}
                  />
                  <Bar 
                    dataKey="passRate" 
                    name={FIELD_LABELS.passRatePercent} 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                    className="cursor-pointer hover:brightness-125 transition-all"
                    onClick={handleBarClick}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Testing Volume Trend */}
          <div className="automotive-card p-5 sm:p-6 w-full">
            <div className="flex items-center gap-2 mb-6">
              <Activity size={16} className="text-blue-500" />
              <h3 className="text-sm font-black italic tracking-tighter uppercase text-slate-200">{FIELD_LABELS.dailyTestingVolume}</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" tick={{fill: '#64748b', fontSize: 10}} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#0f172a', opacity: 0.5}}
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '1rem', padding: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '900' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', bottom: 0 }} />
                  <Bar dataKey="passed" name={FIELD_LABELS.pass?.split(' / ')[1] || 'Passed'} stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={32} />
                  <Bar dataKey="failed" name={FIELD_LABELS.fail?.split(' / ')[1] || 'Failed'} stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Area (Actionable Insights) */}
        <div className="col-span-1 border-l-0 lg:border-l border-white/5 pl-0 lg:pl-6 space-y-6">
          
          {/* Top Failed Cases (From True test_results Database) */}
          <div className="automotive-card p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="text-sm font-black italic tracking-tighter uppercase text-amber-500">{FIELD_LABELS.topFailedCases}</h3>
            </div>
            
            <div className="space-y-3">
              {topFailed.length > 0 ? topFailed.map((item, idx) => {
                const caseDef = casesMap[item.case_id];
                const displayName = caseDef 
                  ? `${caseDef.category} > ${caseDef.function}`
                  : `Case ID #${item.case_id}`;
                  
                return (
                  <div key={idx} className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex justify-between items-center group">
                    <div className="flex flex-col flex-1 overflow-hidden pr-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{displayName}</span>
                      <span className="text-xs text-slate-300 font-black truncate">{caseDef?.content || 'Unknown Case'}</span>
                    </div>
                    <div className="bg-amber-500/10 text-amber-500 font-black text-xs px-2 py-1 rounded">
                      {item.fail_count} {FIELD_LABELS.fails}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-xs text-slate-500 font-bold uppercase text-center py-4">{FIELD_LABELS.noFailures}</div>
              )}
            </div>
          </div>

          {/* Recent Defect Log */}
          <div className="automotive-card p-5 relative overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
              <Bug size={16} className="text-rose-500" />
              <h3 className="text-sm font-black italic tracking-tighter uppercase text-rose-500">{FIELD_LABELS.recentDefectFeedTitle}</h3>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-1">
              {bugsData.length > 0 ? bugsData.slice(0, 15).map((bug, idx) => {
                const caseDef = casesMap[bug.case_id];
                const sessionInfo = data.find(s => s.id === bug.session_id);
                const testerName = sessionInfo && sessionInfo.tester ? sessionInfo.tester : 'Unknown';
                
                return (
                  <div key={idx} className="border-l-2 border-rose-500 pl-3 py-1 mb-4">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[75%]">
                        {caseDef ? `${caseDef.category} > ${caseDef.function}` : `Case #${bug.case_id}`}
                      </span>
                      <div className="flex flex-col items-end flex-shrink-0 ml-2">
                        <span className="text-[9px] text-slate-600 font-black">
                          {bug.timestamp ? new Date(bug.timestamp).toLocaleDateString() : ''}
                        </span>
                        <span className="text-[9px] text-blue-500/80 font-bold uppercase mt-0.5">
                          {testerName}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 font-medium line-clamp-2">
                      <span className="text-rose-400 font-bold mr-1">BUG:</span>
                      {bug.description || 'No description provided.'}
                    </p>
                  </div>
                );
              }) : (
                <div className="text-xs text-slate-500 font-bold uppercase text-center py-4">Zero active defects 🚀</div>
              )}
            </div>
            {/* Scroll indicators fade out */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none rounded-b-xl" />
          </div>

        </div>
      </div>
      
    </div>
  );
}
