import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Pencil, Database, Search, Calendar, Car, User, MapPin } from 'lucide-react';
import { ARCHITECTURES, API_BASE } from '../constants.js';
import { formatDateTime } from '../utils/formatters.js';

export default function HistoryView({
  historySessions, setHistorySessions,
  cases, setCaseResults, setBugs, setCurrentCaseIndex,
  setVehicleModel, setModelYear, setVin, setArchitecture,
  setIviModule, setCommModule, setAddress, setPackagePhoto, setEnvPhoto, setTester, setMileage,
  setCurrentSessionId,
  setEditingSession,
  resetAllFields, setView,
  createEmptyResult,
}) {
  const [historyFilters, setHistoryFilters] = useState({
    startDate: '', endDate: '', vehicleModel: '', architecture: ''
  });

  const doSearch = () => {
    const query = new URLSearchParams(
      Object.entries(historyFilters).filter(([, v]) => v)
    ).toString();
    fetch(`${API_BASE}/test-sessions?${query}`)
      .then(res => res.json())
      .then(data => setHistorySessions(data))
      .catch(err => alert('Failed to search: ' + err.message));
  };

  const resumeSession = (session) => {
    fetch(`${API_BASE}/test-sessions/${session.id}`)
      .then(res => res.json())
      .then(data => {
        setVehicleModel(data.vehicle.vehicle_model || '');
        setModelYear(data.vehicle.model_year || '');
        setVin(data.vehicle.vin || '');
        setArchitecture(data.vehicle.architecture || 'GA');
        setIviModule(data.vehicle.ivi_module || 'info');
        setCommModule(data.vehicle.comm_module || 'TCP');
        setAddress(data.vehicle.address || '');
        setPackagePhoto(data.vehicle.package_photo || null);
        setEnvPhoto(data.vehicle.env_photo || null);
        setTester(data.vehicle.tester || '');
        setMileage(data.vehicle.mileage || '');
        setCurrentSessionId(data.vehicle.id);

        const newResults = cases.map(c => {
          const found = data.results.find(r => r.case_id == c.id);
          return found ? {
            result: found.result,
            notes: found.notes || '',
            startTime: found.start_time,
            carExecTime: found.car_exec_time,
            appFeedbackTime: found.app_feedback_time,
            media: []
          } : createEmptyResult();
        });
        setCaseResults(newResults);
        setBugs(data.bugs || []);
        const firstEmpty = newResults.findIndex(r => r.result === null);
        setCurrentCaseIndex(firstEmpty !== -1 ? firstEmpty : 0);
        setView('test');
      })
      .catch(err => alert('Failed to load session: ' + err.message));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full p-3 sm:p-8">
        <button onClick={() => { resetAllFields(); setView('home'); }} className="mb-8 flex items-center text-blue-400 font-bold group">
          <ChevronLeft size={20} className="group-active:-translate-x-1 transition-transform" /> 
          <span className="group-active:-translate-x-1 transition-transform">Back to Home</span>
        </button>

        <header className="mb-6 pl-1">
          <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight capitalize leading-tight">
            Historical Test Record
          </h1>
        </header>

        {/* Filter Section */}
        <section className="bg-[#121826] rounded-3xl p-5 mb-8 border border-slate-800/50">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Filter Records</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest shrink-0 w-24">Start Date</label>
              <input type="date" className="flex-1 bg-slate-950/50 border border-slate-800/50 h-9 p-2 rounded-xl text-[11px] font-bold text-slate-300 outline-none focus:border-blue-500" value={historyFilters.startDate} onChange={e => setHistoryFilters({ ...historyFilters, startDate: e.target.value })} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest shrink-0 w-24">End Date</label>
              <input type="date" className="flex-1 bg-slate-950/50 border border-slate-800/50 h-9 p-2 rounded-xl text-[11px] font-bold text-slate-300 outline-none focus:border-blue-500" value={historyFilters.endDate} onChange={e => setHistoryFilters({ ...historyFilters, endDate: e.target.value })} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest shrink-0 w-24">Vehicle Model</label>
              <input placeholder="e.g. NDLB" className="flex-1 bg-slate-950/50 border border-slate-800/50 h-9 p-2 px-3 rounded-xl text-[11px] font-bold text-slate-300 outline-none focus:border-blue-500 placeholder:text-slate-700" value={historyFilters.vehicleModel} onChange={e => setHistoryFilters({ ...historyFilters, vehicleModel: e.target.value })} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest shrink-0 w-24">Architecture</label>
              <div className="relative flex-1">
                <select className="w-full bg-slate-950/50 border border-slate-800/50 h-9 p-1 px-3 rounded-xl text-[11px] font-bold text-slate-300 outline-none focus:border-blue-500 appearance-none" value={historyFilters.architecture} onChange={e => setHistoryFilters({ ...historyFilters, architecture: e.target.value })}>
                  <option value="">All</option>
                  {ARCHITECTURES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>
          <button
            onClick={doSearch}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[11px] tracking-widest py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw size={14} /> Search / Filter
          </button>
        </section>

        {/* Sessions List */}
        <section className="space-y-4">
          <div className="px-2 mb-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Results ({historySessions.length})</h2>
          </div>
          {historySessions.length === 0 ? (
            <div className="bg-[#121826] rounded-3xl py-16 text-center text-slate-700 border border-slate-800/50">
               <Database size={32} className="mx-auto mb-4 opacity-20" />
               <p className="font-black uppercase tracking-widest text-xs">Registry Empty</p>
               <p className="text-[10px] mt-1 font-bold text-slate-600">No records found matching criteria</p>
            </div>
          ) : (
            historySessions.map(session => (
              <div key={session.id} className="bg-[#121826] rounded-3xl p-5 border border-slate-800/50">
                {/* Top Bar */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-700/50 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">VSESSION-{session.id}</span>
                    <span className="text-blue-400 text-[10px] font-mono font-bold">{formatDateTime(session.timestamp)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-white leading-none block">{session.total_count || 208}</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block -mt-1">Cases</span>
                  </div>
                </div>

                {/* Title Row */}
                <div className="flex items-center gap-3 mb-5">
                  <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase truncate flex-1 leading-none">
                    {session.model_year ? `MY${session.model_year} ` : ''}{session.vehicle_model || 'UNKNOWN'}
                  </h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingSession(session); }}
                    className="p-1.5 bg-slate-800/50 text-slate-400 rounded-full hover:text-white hover:bg-slate-700 transition-all active:scale-90 shrink-0"
                  >
                    <Pencil size={12} />
                  </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-5">
                  <div>
                    <div className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">VIN</div>
                    <div className="text-xs text-white font-mono break-all leading-tight">{session.vin || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Architecture</div>
                    <div className="text-xs text-white font-bold">{session.architecture || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Address</div>
                    <div className="text-xs text-white font-bold">{session.address || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Tester</div>
                    <div className="text-xs text-white font-bold">{session.tester || '-'}</div>
                  </div>
                  <div className="flex items-center">
                    {session.package_photo ? (
                      <img src={session.package_photo} alt="pkg" className="w-10 h-10 rounded-lg shadow-sm object-cover border border-slate-700" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700/50">
                         <Car size={16} className="text-slate-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Execution Rate</div>
                    <div className="text-sm text-white font-black">{session.total_count > 0 ? Math.round((session.case_count / session.total_count) * 100) : 0}%</div>
                  </div>
                </div>

                {/* Pass Rate & Action */}
                <div className="space-y-4">
                  <div>
                    <div className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pass Rate</div>
                    <div className="flex items-end gap-2">
                      <span className={`text-xl font-black leading-none tracking-tight ${session.pass_fail_count > 0 && (session.pass_count / session.pass_fail_count) >= 0.8 ? 'text-emerald-400' : 'text-emerald-400'}`}>
                        {session.pass_fail_count > 0 ? Math.round((session.pass_count / session.pass_fail_count) * 100) : 0}%
                      </span>
                      {session.fail_count > 0 && (
                        <span className="text-[10px] font-bold text-red-400 pb-0.5">({session.fail_count} Fails)</span>
                      )}
                      {session.fail_count === 0 && session.pass_fail_count > 0 && (
                        <span className="text-[10px] font-bold text-emerald-500 pb-0.5">(0 Fails)</span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => resumeSession(session)}
                    className="w-full bg-[#1e293b] hover:bg-slate-700 text-blue-400 text-[11px] font-black uppercase tracking-widest py-3.5 rounded-2xl transition-all active:scale-95"
                  >
                    Resume Testing
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
