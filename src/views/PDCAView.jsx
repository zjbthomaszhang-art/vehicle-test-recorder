import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Save, Bug, Search, FileText, CheckCircle2, User, Flag, MessageSquare } from 'lucide-react';
import { FIELD_LABELS } from '../constants/labels.js';

const STAGES = [
  { id: 'Plan', label: FIELD_LABELS.statusPlan, color: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500' },
  { id: 'Do', label: FIELD_LABELS.statusDo, color: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-500' },
  { id: 'Check', label: FIELD_LABELS.statusCheck, color: 'border-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
  { id: 'Act', label: FIELD_LABELS.statusAct, color: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500' }
];

export default function PDCAView({ API_BASE, setView }) {
  const [bugs, setBugs] = useState([]);
  const [casesMap, setCasesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedBug, setSelectedBug] = useState(null);

  // Drag state
  const [draggedBugId, setDraggedBugId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/bugs`).then(res => res.json()),
      fetch(`${API_BASE}/cases`).then(res => res.json())
    ]).then(([bugsData, casesData]) => {
      const cMap = {};
      if (Array.isArray(casesData)) {
        casesData.forEach(c => cMap[c.id] = c);
      }
      setCasesMap(cMap);

      if (Array.isArray(bugsData)) {
        bugsData.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        setBugs(bugsData);
      }
      setLoading(false);
    });
  };

  const handleDragStart = (e, bugId) => {
    setDraggedBugId(bugId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedBugId) return;

    const bug = bugs.find(b => b.id === draggedBugId);
    if (bug && bug.status !== targetStatus) {
      // Optimistic update
      setBugs(prev => prev.map(b => b.id === draggedBugId ? { ...b, status: targetStatus } : b));
      
      try {
        await fetch(`${API_BASE}/bugs/${draggedBugId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetStatus })
        });
      } catch (err) {
        console.error("Failed to update status", err);
        fetchData(); // Rollback on error
      }
    }
    setDraggedBugId(null);
  };

  const openBugModal = (bug) => {
    setSelectedBug({ ...bug });
  };

  const handleModalSave = async () => {
    if (!selectedBug) return;
    try {
      await fetch(`${API_BASE}/bugs/${selectedBug.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignee: selectedBug.assignee,
          root_cause: selectedBug.root_cause,
          action_notes: selectedBug.action_notes
        })
      });
      fetchData();
      setSelectedBug(null);
    } catch (err) {
      console.error("Failed to save bug details", err);
    }
  };

  if (loading && bugs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] text-slate-800 dark:text-slate-100 font-sans p-4 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('dashboard')} 
            className="p-2 sm:p-3 bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent border border-slate-200 dark:border-[#1e293b] rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-all active:scale-95"
            title={FIELD_LABELS.backToDashboard}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-3xl font-black italic tracking-tighter uppercase leading-none">
              PDCA <span className="text-blue-500">Center</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
              Defect Kanban Board
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 mt-4 sm:mt-0 text-slate-500 text-xs font-bold uppercase">
          <span className="text-amber-500">Drag & Drop</span> support enabled
        </div>
      </header>

      {/* Kanban Board Layout */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start custom-scrollbar h-full">
        {STAGES.map(stage => {
          const stageBugs = bugs.filter(b => b.status === stage.id || (!b.status && stage.id === 'Plan'));
          
          return (
            <div 
              key={stage.id} 
              className="flex-shrink-0 w-[300px] h-full flex flex-col bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent/40 rounded-2xl border border-white/5 overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div className={`p-4 border-b ${stage.color} border-opacity-50 ${stage.bg} flex justify-between items-center top-0 sticky`}>
                <span className={`font-black uppercase tracking-wider text-sm ${stage.text}`}>
                  {stage.label}
                </span>
                <span className="bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent/50 text-slate-500 dark:text-slate-400 font-black text-xs px-2 py-1 rounded">
                  {stageBugs.length}
                </span>
              </div>
              
              {/* Cards Container */}
              <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                {stageBugs.map(bug => {
                  const caseDef = casesMap[bug.case_id];
                  return (
                    <div 
                      key={bug.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, bug.id)}
                      onClick={() => openBugModal(bug)}
                      className={`bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent border border-slate-200 dark:border-[#334155]/50 hover:border-slate-500 p-3 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-lg transition-all group`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none px-1.5 py-0.5 rounded">
                          BUG {bug.id}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold">
                          {new Date(bug.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 leading-tight line-clamp-1">
                          {caseDef ? `${caseDef.category} > ${caseDef.function}` : `Case #${bug.case_id}`}
                        </h4>
                        <p className="text-sm font-medium text-rose-300 line-clamp-2">
                          {bug.description || FIELD_LABELS.noDescription}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-blue-400/80">
                          <User size={12} />
                          {bug.assignee || FIELD_LABELS.unassigned}
                        </div>
                        {bug.root_cause && (
                          <MessageSquare size={12} className="text-emerald-500/50" title={FIELD_LABELS.rootCause?.split(' / ')[1] || 'Analyzed'} />
                        )}
                      </div>
                    </div>
                  )
                })}
                {stageBugs.length === 0 && (
                  <div className="border border-dashed border-slate-200 dark:border-[#1e293b] rounded-lg h-24 flex items-center justify-center text-slate-600 font-bold text-xs uppercase tracking-widest pointer-events-none">
                    Drop Here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Modal */}
      {selectedBug && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent border border-slate-200 dark:border-[#334155] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1e293b] flex justify-between items-center bg-slate-50 dark:bg-[#0f1523]/50">
              <div className="flex items-center gap-3">
                <div className="bg-rose-500/10 p-2 rounded-lg">
                  <Bug className="text-rose-500" size={20} />
                </div>
                <div>
                  <h3 className="font-black italic uppercase tracking-tighter text-lg leading-none">
                    Defect <span className="text-rose-500">#{selectedBug.id}</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    {casesMap[selectedBug.case_id] ? `${casesMap[selectedBug.case_id].category} > ${casesMap[selectedBug.case_id].function}` : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedBug(null)} className="text-slate-500 hover:text-slate-900 dark:text-white p-2">
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Display Bug Info */}
              <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-xl">
                <span className="text-[10px] font-black uppercase text-rose-500 mb-1 block">Failure Description 故障描述</span>
                <p className="text-sm font-medium text-rose-200">{selectedBug.description}</p>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-2 gap-2">
                    <User size={14} className="text-blue-500" />
                    {FIELD_LABELS.assignee}
                  </label>
                  <input 
                    type="text" 
                    value={selectedBug.assignee || ''} 
                    onChange={e => setSelectedBug({...selectedBug, assignee: e.target.value})}
                    placeholder="Enter assignee name..."
                    className="w-full gm-input"
                  />
                </div>
                <div>
                  <label className="flex items-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-2 gap-2">
                    <Flag size={14} className="text-amber-500" />
                    Status (当前状态)
                  </label>
                  <div className="bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-[#1e293b] rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 font-bold">
                    {STAGES.find(s => s.id === (selectedBug.status || 'Plan'))?.label}
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-2 gap-2">
                  <Search size={14} className="text-indigo-500" />
                  Root Cause Analysis (根因分析)
                </label>
                <textarea 
                  value={selectedBug.root_cause || ''} 
                  onChange={e => setSelectedBug({...selectedBug, root_cause: e.target.value})}
                  placeholder="Analyze why this failure occurred..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-[#1e293b] rounded-lg p-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors font-mono resize-none custom-scrollbar"
                />
              </div>

              <div>
                <label className="flex items-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-2 gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Action / Solution (对策与闭环)
                </label>
                <textarea 
                  value={selectedBug.action_notes || ''} 
                  onChange={e => setSelectedBug({...selectedBug, action_notes: e.target.value})}
                  placeholder="How was this fixed and standardized?"
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-[#1e293b] rounded-lg p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono resize-none custom-scrollbar"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent flex justify-end gap-3">
              <button 
                onClick={() => setSelectedBug(null)}
                className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs border border-slate-200 dark:border-[#334155] hover:bg-slate-100 dark:hover:bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleModalSave}
                className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
