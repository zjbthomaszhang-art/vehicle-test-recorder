import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Plus, Search, Edit3, X, ChevronLeft, UploadCloud, RefreshCw, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import CustomSelect from '../components/CustomSelect.jsx';
import MobileNavigator from '../components/MobileNavigator.jsx';
import { API_BASE } from '../constants.js';

export default function AdminView({ cases, setCases, setView, setToast }) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [vinStatus, setVinStatus] = useState({ count: null, uploaded_at: null });
  const [vinUploading, setVinUploading] = useState(false);
  const vinFileRef = useRef(null);

  // Load VIN rules status on mount
  useEffect(() => {
    fetch(`${API_BASE}/vin-rules/status`)
      .then(r => r.json())
      .then(d => setVinStatus(d))
      .catch(() => {});
  }, []);

  const handleVinUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVinUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/vin-rules/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setVinStatus({ count: data.count, uploaded_at: new Date().toISOString() });
        if (typeof setToast === 'function') setToast({ message: `VIN瑙ｆ瀽琛ㄥ凡鏇存柊锛屽叡 ${data.count} 鏉¤鍒檂, type: 'success' });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      if (typeof setToast === 'function') setToast({ message: "Upload failed: " + err.message, type: "error" });
    } finally {
      setVinUploading(false);
      e.target.value = '';
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    id: '', category: '', functionCategory: '', type: '',
    function: '', expected: '', content: ''
  });

  const uniqueFunctionCategories = [...new Set(cases.map(c => c.functionCategory || c.function_category).filter(Boolean))];

  const filteredCases = cases.filter(c => {
    let match = true;
    if (filterCat && c.functionCategory !== filterCat && c.function_category !== filterCat) match = false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!c.function?.toLowerCase().includes(q) && !c.content?.toLowerCase().includes(q)) match = false;
    }
    return match;
  });

  const isEditing = cases.some(c => String(c.id) === String(formData.id));

  const handleAdd = () => {
    if (!formData.id || !formData.function || !formData.type) {
      if (typeof setToast === 'function') setToast({ message: '蹇呭～瀛楁涓嶅畬鏁?, type: 'error' });
      return;
    }
    const newCase = { ...formData, id: String(formData.id) };
    fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCase)
    })
      .then(res => res.json())
      .then(saved => {
        const updatedCase = {
          id: newCase.id,
          category: newCase.category,
          function_category: newCase.functionCategory,
          function: newCase.function,
          type: newCase.type,
          expected: newCase.expected,
          content: newCase.content
        };
        
        if (isEditing) {
          setCases(cases.map(c => String(c.id) === String(updatedCase.id) ? updatedCase : c));
          if (typeof setToast === 'function') setToast({ message: '淇敼鎴愬姛', type: 'success' });
        } else {
          setCases([...cases, updatedCase]);
          if (typeof setToast === 'function') setToast({ message: '娣诲姞鎴愬姛', type: 'success' });
        }
        setFormData({ id: '', category: '', functionCategory: '', type: '', function: '', expected: '', content: '' });
      })
      .catch(err => {
         if (typeof setToast === 'function') setToast({ message: '鎿嶄綔澶辫触', type: 'error' });
      });
  };

  const handleDelete = (id) => {
    fetch(`${API_BASE}/cases/${id}`, { method: 'DELETE' })
      .then(() => {
         setCases(cases.filter(c => c.id !== id));
         setDeleteConfirmId(null);
         if (typeof setToast === 'function') setToast({ message: '鍒犻櫎鎴愬姛', type: 'success' });
      });
  };

  const fileRef = useRef(null);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof setToast === 'function') setToast({ message: '姝ｅ湪瑙ｆ瀽...', type: 'info' });

    const reader = new FileReader();
    reader.onload = (evt) => {
      import('xlsx').then(XLSX => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length < 2) {
           if (typeof setToast === 'function') setToast({ message: '鏂囦欢涓虹┖鎴栨牸寮忛敊璇?, type: 'error' });
           return;
        }
        const headers = data[0];
        
        const mappedCases = data.slice(1).map(row => {
          let caseObj = { category: '', functionCategory: '', function: '', content: '', type: 'timing', expected: '' };
          headers.forEach((h, idx) => {
            const val = row[idx] || '';
            const key = (h || '').toString().toLowerCase();
            if (key === 'id' || key.includes('id')) caseObj.id = String(val);
            if (key === 'category' || key.includes('涓氬姟鍦烘櫙')) caseObj.category = String(val);
            if (key === 'function_category' || key.includes('澶х被')) caseObj.functionCategory = String(val);
            else if (key === 'function' || key.includes('鍔熻兘')) caseObj.function = String(val);
            if (key === 'content' || key.includes('鎻忚堪') || key.includes('鍐呭')) caseObj.content = String(val);
            if (key === 'type' || key.includes('绫诲瀷')) {
               const lower = String(val).toLowerCase();
               if(lower.includes('timing')) caseObj.type = 'timing';
               else if(lower.includes('query')) caseObj.type = 'query';
               else if(lower.includes('simple')) caseObj.type = 'simple';
               else caseObj.type = val || 'simple';
            }
            if (key === 'expected' || key.includes('鏈熸湜')) caseObj.expected = String(val);
          });
          return caseObj;
        }).filter(c => c.id && c.function);

        if (mappedCases.length > 0) {
          fetch(`${API_BASE}/cases/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mappedCases)
          }).then(() => {
             fetch(`${API_BASE}/cases`)
               .then(res => res.json())
               .then(latestCases => {
                  setCases(latestCases);
                  if (typeof setToast === 'function') setToast({ message: `鎴愬姛瀵煎叆 ${mappedCases.length} 鏉¤褰昤, type: 'success' });
               });
          }).catch(() => {
             if (typeof setToast === 'function') setToast({ message: '瀵煎叆澶辫触', type: 'error' });
          });
        } else {
           if (typeof setToast === 'function') setToast({ message: '鏈壘鍒版湁鏁堟暟鎹?, type: 'error' });
        }
      });
    };
    reader.readAsBinaryString(file);
  };

  const handleEdit = (c) => {
    setFormData({
      id: c.id,
      category: c.category || '',
      functionCategory: c.functionCategory || c.function_category || '',
      type: c.type || '',
      function: c.function || '',
      expected: c.expected || '',
      content: c.content || ''
    });
    // Scroll to top of the list container/main to see the form
    const mainEl = document.getElementById('admin-main-scroll');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <header className="px-[24px] pt-[44px] pb-[8px] w-full z-10 shrink-0">
        <h1 className="text-[26px] font-[800] text-slate-900 dark:text-white leading-none tracking-tight">妗堜緥绠＄悊</h1>
      </header>

      <main id="admin-main-scroll" className="flex-1 overflow-y-auto px-[24px] pt-[16px] pb-[100px] flex flex-col gap-[12px] custom-scrollbar">
        
        {/* VIN Rules Management 鈥?PC only */}
        <div className="hidden md:block bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[16px] p-[16px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[10px]">
              <FileSpreadsheet size={20} className="text-slate-500 dark:text-[#94a3b8]" strokeWidth={1.5} />
              <span className="text-[13px] font-[800] text-slate-600 dark:text-[#94a3b8] uppercase tracking-wider">VIN 瑙ｆ瀽琛?/span>
            </div>
            <div className="flex items-center gap-[12px]">
              {vinStatus.count !== null && (
                <div className="flex items-center gap-[6px] text-[12px] text-slate-400 dark:text-slate-500">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>
                    鍏?<strong className="text-slate-700 dark:text-slate-300">{vinStatus.count}</strong> 鏉¤鍒?                    {vinStatus.uploaded_at && (
                      <> &nbsp;路&nbsp; 鏇存柊浜?{new Date(vinStatus.uploaded_at).toLocaleDateString('zh-CN')}</>
                    )}
                  </span>
                </div>
              )}
              <input ref={vinFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleVinUpload} />
              <button
                onClick={() => vinFileRef.current?.click()}
                disabled={vinUploading}
                className="flex items-center gap-[6px] px-[12px] py-[6px] bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-[12px] font-[700] rounded-[8px] transition-colors"
              >
                {vinUploading
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <UploadCloud size={14} />}
                {vinUploading ? '涓婁紶涓?..' : '涓婁紶鏂扮増 Excel'}
              </button>
            </div>
          </div>
        </div>

        {/* Add Form */}
        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[16px] p-[12px] flex flex-col gap-[8px]">
          <span className="text-[12px] font-[900] text-slate-500 dark:text-[#94a3b8] px-[4px]">{isEditing ? '淇敼妗堜緥' : '鏂板妗堜緥'}</span>
          
          <div className="flex gap-[8px] w-full items-center">
            <input 
              placeholder="ID" className="w-[50px] shrink-0 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] p-[8px] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6]"
              value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})}
            />
            <input 
              placeholder="涓氬姟鍦烘櫙" className="flex-1 min-w-0 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] p-[8px] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6]"
              value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
            />
            <input 
              placeholder="鍔熻兘澶х被" className="w-[110px] shrink-0 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] p-[8px] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6]"
              value={formData.functionCategory} onChange={e => setFormData({...formData, functionCategory: e.target.value})}
            />
          </div>

          <div className="flex gap-[8px] w-full">
             <input 
              placeholder="鍔熻兘" className="flex-1 min-w-0 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] p-[8px] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6]"
              value={formData.function} onChange={e => setFormData({...formData, function: e.target.value})}
             />
             <CustomSelect
                textColor="text-slate-900 dark:text-white text-[16px]"
               value={formData.type || ''}
               onChange={(val) => setFormData({...formData, type: val})}
               options={[
                 { value: 'timing', label: 'Timing' },
                 { value: 'query', label: 'Query' },
                 { value: 'simple', label: 'Simple' },
               ]}
               placeholder="妗堜緥绫诲瀷"
               align="left"
               className="w-[110px] shrink-0 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] px-[8px] py-[8px]"
             />
          </div>

          <div className="w-full">
             <input 
              placeholder="娴嬭瘯鍐呭" className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] p-[8px] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6]"
              value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
             />
          </div>

          <div className="w-full">
             <input 
              placeholder="鏈熸湜缁撴灉" className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] p-[8px] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6]"
              value={formData.expected} onChange={e => setFormData({...formData, expected: e.target.value})}
             />
          </div>
           <button 
            onClick={handleAdd} 
            className={`w-full ${isEditing ? 'bg-[#10b981] hover:bg-[#059669]' : 'bg-[#3b82f6] hover:bg-[#2563eb]'} transition-colors rounded-[12px] p-[10px] flex justify-center items-center mt-[4px]`}
          >
             <span className="text-[12px] font-[900] text-white">{isEditing ? '淇濆瓨淇敼' : '娣诲姞妗堜緥'}</span>
          </button>
        </div>

        {/* List Header */}
        <div className="flex justify-between items-center w-full mt-[12px]">
           <span className="text-[12px] font-[900] text-slate-500 dark:text-[#94a3b8]">褰撳墠妗堜緥鏁?({cases.length})</span>
           <input type="file" accept=".xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden" />
           <button onClick={() => fileRef.current?.click()} className="hidden sm:flex items-center gap-[4px] bg-[#059669]/20 border border-[#10b981]/30 hover:bg-[#059669]/30 transition-colors rounded-[12px] px-[12px] py-[6px]">
              <FolderOpen size={14} className="text-[#34d399]" />
              <span className="text-[10px] font-[700] text-[#34d399]">瀵煎叆</span>
           </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[20px] p-[16px] flex flex-col gap-[12px]">
           <span className="text-[10px] font-[900] text-slate-500 dark:text-[#94a3b8]">绛涢€夌敤渚?/span>
           <div className="flex gap-[8px] w-full">
              <CustomSelect
                textColor="text-slate-900 dark:text-white text-[16px]"
                value={filterCat}
                onChange={setFilterCat}
                options={['', ...uniqueFunctionCategories]}
                placeholder="鎸夊姛鑳藉ぇ绫荤瓫閫?
                align="left"
                className="flex-1 min-w-0 w-1/2 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] px-[12px] py-[8px]"
              />
              <input 
                placeholder="鎼滅储鍔熻兘鍚嶇О..." className="flex-1 min-w-0 w-1/2 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] p-[8px] px-[12px] text-[12px] text-slate-900 dark:text-white focus:outline-none"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Cases List */}
        <div className="flex flex-col gap-[8px]">
           {filteredCases.map(c => (
              <div key={c.id} className="bg-white dark:bg-[#121826] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#1e293b] rounded-[14px] p-[10px] px-[14px] flex justify-between items-center transition-transform active:scale-[0.98]">
                 <div className="flex flex-col gap-[4px] flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-[6px] h-[16px]">
                       <div className="bg-[#3b82f6]/20 px-[6px] h-[16px] flex items-center justify-center rounded border border-[#3b82f6]/30">
                          <span className="text-[10px] font-[800] text-[#60a5fa] leading-none translate-y-[-0.5px]">#{c.id}</span>
                       </div>
                       <span className="text-[10px] font-[800] bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent truncate leading-[16px] mt-[0.5px]">
                         - {c.category ? `${c.category} - ` : ''}{c.functionCategory || c.function_category}
                       </span>
                    </div>
                    <div className="flex items-center gap-[6px] mt-0 overflow-hidden flex-wrap sm:flex-nowrap">
                       <span className="text-[13px] font-[900] text-slate-900 dark:text-white shrink-0">{c.function}</span>
                       {c.content && <span className="text-[11px] font-[500] text-slate-700 dark:text-[#cbd5e1] truncate shrink">- {c.content}</span>}
                       <span className="text-[10px] font-[normal] text-[#64748b] shrink-0">| {c.type}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-[12px]">
                    <button onClick={() => handleEdit(c)} className="p-2 -mr-2 text-slate-500 dark:text-[#475569] hover:text-slate-900 dark:text-white transition-colors">
                       <Edit3 size={18} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(c.id)} className="p-2 -mr-2 text-[#ef4444] hover:text-red-400 transition-colors">
                       <X size={20} />
                    </button>
                 </div>
              </div>
           ))}
        </div>
      </main>

      <MobileNavigator currentView="admin" setView={setView} />

      {/* Custom Confirm Dialog for Deletion */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000080] backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121826] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#1e293b] rounded-[16px] p-[20px] w-full max-w-[320px] shadow-2xl flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[8px]">
              <span className="text-[18px] font-[900] text-slate-900 dark:text-white">纭鍒犻櫎妗堜緥锛?/span>
              <span className="text-[13px] font-[500] text-slate-500 dark:text-[#94a3b8] leading-snug">姝ゆ搷浣滀笉鍙仮澶嶃€傛渚嬬殑鍒犻櫎鍙兘浼氬奖鍝嶇浉鍏冲巻鍙叉墽琛岃褰曠殑鏁版嵁鍏宠仈銆?/span>
            </div>
            <div className="flex justify-end gap-[12px] mt-[8px]">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-[16px] py-[8px] rounded-[10px] bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none hover:bg-slate-100 dark:hover:bg-[#334155] text-[13px] font-[800] text-slate-700 dark:text-[#cbd5e1] transition-colors"
              >
                鍙栨秷
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-[16px] py-[8px] rounded-[10px] bg-[#ef4444] hover:bg-red-500 text-[13px] font-[900] text-white shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-colors"
              >
                纭鍒犻櫎
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

