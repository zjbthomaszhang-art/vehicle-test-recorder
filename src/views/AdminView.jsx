import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, FileText,
  Pencil, X, RefreshCw
} from 'lucide-react';
import { CATEGORIES, FUNCTION_CATEGORIES, CASE_TYPES, API_BASE } from '../constants.js';
import { FIELD_LABELS } from '../constants/labels.js';

/**
 * Admin view — case management (add/edit, filter, paginated list, Excel import).
 */
export default function AdminView({
  cases, setCases,
  resetAllFields, setView,
}) {
  const [newCase, setNewCase] = useState({
    id: '',
    category: 'Vehicle Service',
    functionCategory: 'Blue Key',
    function: '',
    content: '',
    type: 'simple',
    expected: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const fileInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState({
    category: '', functionCategory: '', function: '', content: '', type: ''
  });

  // Reset pagination when search changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const addCase = () => {
    if (!newCase.category || !newCase.function) {
      alert('Please fill in Category and Function Name');
      return;
    }
    const caseDataToSave = editingId
      ? { ...newCase, id: Number(editingId) }
      : { ...newCase, id: newCase.id ? Number(newCase.id) : (cases.length + 1) };

    fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseDataToSave)
    })
      .then(res => res.json())
      .then(() => {
        const mappedCaseData = { ...caseDataToSave, function_category: caseDataToSave.functionCategory };
        delete mappedCaseData.functionCategory;
        if (editingId) {
          setCases(prev => prev.map(c => c.id === editingId ? mappedCaseData : c));
          setEditingId(null);
        } else {
          setCases(prev => [...prev, mappedCaseData]);
        }
        setNewCase({ id: '', category: 'Vehicle Service', functionCategory: 'Blue Key', function: '', content: '', type: 'simple', expected: '', notes: '' });
      })
      .catch(err => alert('Failed to save case: ' + err.message));
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setNewCase({ ...c, functionCategory: c.function_category || 'Blue Key' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewCase({ id: '', category: 'Vehicle Service', functionCategory: 'Blue Key', function: '', content: '', type: 'simple', expected: '', notes: '' });
  };

  const removeCase = (id) => {
    fetch(`${API_BASE}/cases/${id}`, { method: 'DELETE' })
      .then(res => { if (!res.ok) throw new Error('Server responded with ' + res.status); return res.json(); })
      .then(() => setCases(prev => prev.filter(c => c.id !== id)))
      .catch(err => alert('Failed to delete case: ' + err.message));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        import('xlsx').then(XLSX => {
          const wb = XLSX.read(evt.target.result, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws);
          const formattedCases = data.map(item => ({
            id: item.id ? Number(item.id) : cases.length + Math.floor(Math.random() * 1000),
            category: item.category || 'Unknown',
            functionCategory: item.functionCategory || item.function_category || item['Function Category'] || '',
            function: item.function || 'Unknown Function',
            content: item.content || '',
            type: item.type || 'simple',
            expected: item.expected || ''
          }));
          if (formattedCases.length === 0) { alert('No valid data found in the Excel file.'); return; }
          fetch(`${API_BASE}/cases/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formattedCases)
          })
            .then(res => { if (!res.ok) throw new Error('Bulk import failed: ' + res.statusText); return res.json(); })
            .then(result => { alert(`Successfully imported ${result.count} cases!`); return fetch(`${API_BASE}/cases`); })
            .then(res => res.json())
            .then(data => { if (data.length > 0) setCases(data); })
            .catch(err => alert('Import failed: ' + err.message))
            .finally(() => { if (fileInputRef.current) fileInputRef.current.value = ''; });
        });
      } catch (error) {
        alert('Failed to parse Excel file, please check the format.');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Filtering + pagination
  const filteredCases = cases.filter(c => {
    if (searchQuery.category && c.category !== searchQuery.category) return false;
    if (searchQuery.type && c.type !== searchQuery.type) return false;
    if (searchQuery.functionCategory && !(c.function_category || '').toLowerCase().includes(searchQuery.functionCategory.toLowerCase())) return false;
    if (searchQuery.function && !c.function.toLowerCase().includes(searchQuery.function.toLowerCase())) return false;
    if (searchQuery.content && !c.content.toLowerCase().includes(searchQuery.content.toLowerCase())) return false;
    return true;
  });
  const sortedCases = [...filteredCases].sort((a, b) => Number(a.id) - Number(b.id));
  const totalPages = Math.ceil(sortedCases.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCases = sortedCases.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-900 p-6 font-sans text-white overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => { resetAllFields(); setView('home'); }} className="mb-8 flex items-center text-blue-400 font-bold group">
          <ChevronLeft size={20} className="group-active:-translate-x-1 transition-transform" /> Back to Home
        </button>

        <h1 className="text-3xl font-black mb-6 italic tracking-tighter">Case Management</h1>

        {/* Add/Edit Form */}
        <div className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 mb-8">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
            {editingId ? FIELD_LABELS.pencil || '编辑 / Edit' : '新增案例 / Add New Case'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="ID"
              className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors text-white h-10"
              value={newCase.id}
              onChange={e => setNewCase({ ...newCase, id: e.target.value })}
            />
            <div className="relative group">
              <select
                className="w-full bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors text-white appearance-none pr-10 h-10"
                value={newCase.category}
                onChange={e => setNewCase({ ...newCase, category: e.target.value })}
              >
                <option value="车辆服务">Vehicle Service</option>
                <option value="手机应用">Mobile App</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><ChevronRight size={14} className="rotate-90" /></div>
            </div>
            <div className="relative">
              <select
                className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl appearance-none outline-none focus:border-blue-500 transition-colors text-white h-10 w-full cursor-pointer text-xs"
                value={newCase.functionCategory}
                onChange={e => setNewCase({ ...newCase, functionCategory: e.target.value })}
              >
                <option value="蓝键功能">Blue Key</option>
                <option value="白键功能">White Key</option>
                <option value="红键功能">Red Key</option>
                <option value="WiFi">WiFi</option>
                <option value="车机屏">IVI Screen</option>
                <option value="TASK">TASK</option>
                <option value="手机APP-iOS">App-iOS</option>
                <option value="手机APP-Android">App-Android</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><ChevronDown size={16} /></div>
            </div>
            <input
              placeholder="Function (e.g. Remote Lock, Refresh Status)"
              className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors text-white h-10"
              value={newCase.function}
              onChange={e => setNewCase({ ...newCase, function: e.target.value })}
            />
            <input
              placeholder="Test Content (e.g. Remote lock success)"
              className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors text-white h-10"
              value={newCase.content}
              onChange={e => setNewCase({ ...newCase, content: e.target.value })}
            />
            <div className="relative group">
              <select
                className="w-full bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors text-white appearance-none pr-10 h-10"
                value={newCase.type}
                onChange={e => setNewCase({ ...newCase, type: e.target.value })}
              >
                <option value="simple">Simple Check</option>
                <option value="timing">Timing / Control</option>
                <option value="query">Query / Feedback</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><ChevronRight size={14} className="rotate-90" /></div>
            </div>
            <input
              placeholder="Expected Result / Criteria"
              className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors text-white h-10"
              value={newCase.expected}
              onChange={e => setNewCase({ ...newCase, expected: e.target.value })}
            />
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={addCase}
              className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors ${editingId ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              {editingId ? '更新 / Update' : '添加 / Add'}
            </button>
            {editingId && (
              <button onClick={cancelEdit} className="flex-1 py-4 bg-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-600 transition-colors">
                取消 / Cancel
              </button>
            )}
          </div>
        </div>

        {/* Case List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Current Cases ({cases.length})</h2>
            <div>
              <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
              >
                <FileText size={14} /> 导入用例 (Excel) / Import Cases (Excel)
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{FIELD_LABELS.filterCases}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <select className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-blue-500 text-white" value={searchQuery.category} onChange={e => setSearchQuery({ ...searchQuery, category: e.target.value })}>
                <option value="">所有分类 / All Categories</option>
                <option value="车辆服务">Vehicle Service</option>
                <option value="手机应用">Mobile App</option>
              </select>
              <select className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-blue-500 text-white" value={searchQuery.functionCategory} onChange={e => setSearchQuery({ ...searchQuery, functionCategory: e.target.value })}>
                <option value="">所有功能分类 / All Functions</option>
                <option value="蓝键功能">Blue Key</option>
                <option value="白键功能">White Key</option>
                <option value="红键功能">Red Key</option>
                <option value="WiFi">WiFi</option>
                <option value="车机屏">IVI Screen</option>
                <option value="TASK">TASK</option>
                <option value="手机APP-iOS">App-iOS</option>
                <option value="手机APP-Android">App-Android</option>
              </select>
              <input placeholder="功能名称 / Function name..." className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-blue-500 text-white" value={searchQuery.function} onChange={e => setSearchQuery({ ...searchQuery, function: e.target.value })} />
              <input placeholder="测试内容 / Test content..." className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-blue-500 text-white" value={searchQuery.content} onChange={e => setSearchQuery({ ...searchQuery, content: e.target.value })} />
              <select className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-blue-500 text-white" value={searchQuery.type} onChange={e => setSearchQuery({ ...searchQuery, type: e.target.value })}>
                <option value="">所有类型 / All Types</option>
                <option value="simple">Simple Check</option>
                <option value="timing">Timing / Control</option>
                <option value="query">Query / Feedback</option>
              </select>
            </div>
          </div>

          {paginatedCases.map((c) => (
            <div key={c.id} className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700 flex justify-between items-center group">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-400 font-mono">#{c.id}</span>
                  <span className="text-xs font-bold text-blue-400">{c.category}</span>
                  {c.function_category && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">{c.function_category}</span>
                  )}
                </div>
                <div className="text-sm font-black">{c.function}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {c.content} | {c.type === 'timing' ? FIELD_LABELS.timingCapture.split(' / ')[0] : c.type === 'query' ? '查询 / Query' : '简单 / Simple'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(c)} className="p-2 text-slate-600 hover:text-blue-400 transition-colors"><Pencil size={18} /></button>
                <button onClick={() => removeCase(c.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><X size={20} /></button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 overflow-x-auto">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safeCurrentPage === 1} className="px-3 py-2 text-slate-400 hover:text-white disabled:opacity-30 flex items-center gap-1 text-xs font-bold transition-colors whitespace-nowrap">
                <ChevronLeft size={16} /> 上一页 / Prev
              </button>
              <div className="flex gap-1 mx-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => {
                  if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= safeCurrentPage - 2 && pageNumber <= safeCurrentPage + 2)) {
                    return <button key={pageNumber} onClick={() => setCurrentPage(pageNumber)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${safeCurrentPage === pageNumber ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>{pageNumber}</button>;
                  } else if ((pageNumber === safeCurrentPage - 3 && safeCurrentPage > 4) || (pageNumber === safeCurrentPage + 3 && safeCurrentPage < totalPages - 3)) {
                    return <span key={pageNumber} className="w-8 h-8 flex items-center justify-center text-slate-500">...</span>;
                  }
                  return null;
                })}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages} className="px-3 py-2 text-slate-400 hover:text-white disabled:opacity-30 flex items-center gap-1 text-xs font-bold transition-colors whitespace-nowrap">
                下一页 / Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
