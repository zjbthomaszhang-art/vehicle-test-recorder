import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FolderOpen, Edit3, X, Eye, EyeOff, FileSpreadsheet, ListOrdered, GripVertical, RotateCcw, Check, ChevronDown, CheckSquare, Square, PlusCircle, Save } from 'lucide-react';
import CustomSelect from '../components/CustomSelect.jsx';
import MobileNavigator from '../components/MobileNavigator.jsx';
import { assignHierarchicalNumbers } from '../utils/caseNumbering.js';

export default function AdminView({ cases, setCases, setView, setToast, API_BASE }) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  // --- VIN Rules State ---
  const [vinRuleCount, setVinRuleCount] = useState(null);
  const vinFileRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/vin-rules/status`)
      .then(r => r.json())
      .then(d => setVinRuleCount(d.count ?? null))
      .catch(() => {});
  }, [API_BASE]);

  const handleVinImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (typeof setToast === 'function') setToast({ message: '正在导入 VIN 解析表..', type: 'info' });
    const formData = new FormData();
    formData.append('file', file);
    fetch(`${API_BASE}/vin-rules/upload`, { method: 'POST', body: formData })
      .then(r => r.json())
      .then(d => {
        setVinRuleCount(d.count ?? vinRuleCount);
        if (typeof setToast === 'function') setToast({ message: `VIN 解析表已导入 ${d.count} 条规则`, type: 'success' });
      })
      .catch(() => {
        if (typeof setToast === 'function') setToast({ message: 'VIN 解析表导入失败', type: 'error' });
      });
    e.target.value = '';
  };

  // --- Custom Case Order (PC only) ---
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [orderTester, setOrderTester] = useState('');
  const [orderList, setOrderList] = useState([]);      // { id, category, function_category, function }
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [allTesterOrders, setAllTesterOrders] = useState([]);  // [{tester_name, case_ids}]
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Fetch all existing tester orders for the tester dropdown hint
  useEffect(() => {
    if (!showOrderPanel) return;
    fetch(`${API_BASE}/case-orders`)
      .then(r => r.json())
      .then(d => setAllTesterOrders(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [showOrderPanel, API_BASE]);

  // Load a tester's saved order
  const loadTesterOrder = useCallback(async (name) => {
    if (!name) { setOrderList([...cases].sort((a, b) => Number(a.id) - Number(b.id))); return; }
    setOrderLoading(true);
    try {
      const res = await fetch(`${API_BASE}/case-orders/${encodeURIComponent(name)}`);
      const data = await res.json();
      const ids = data.case_ids || [];
      if (ids.length > 0) {
        const idMap = new Map(cases.map(c => [String(c.id), c]));
        const ordered = ids.map(id => idMap.get(String(id))).filter(Boolean);
        const listed = new Set(ids.map(String));
        const remaining = cases.filter(c => !listed.has(String(c.id))).sort((a,b) => Number(a.id)-Number(b.id));
        setOrderList([...ordered, ...remaining]);
      } else {
        setOrderList([...cases].sort((a, b) => Number(a.id) - Number(b.id)));
      }
      setSelectedOrderIds([]);
    } catch { setOrderList([...cases].sort((a, b) => Number(a.id) - Number(b.id))); setSelectedOrderIds([]); }
    finally { setOrderLoading(false); }
  }, [cases, API_BASE]);

  // Drag handlers
  const handleDragStart = (idx) => {
    const item = orderList[idx];
    if (!selectedOrderIds.includes(item.id)) {
      setSelectedOrderIds([item.id]);
      dragIndexRef.current = [item.id];
    } else {
      const sortedSelectedIds = orderList.filter(c => selectedOrderIds.includes(c.id)).map(c => c.id);
      dragIndexRef.current = sortedSelectedIds;
    }
  };
  const handleDragOver = (e, targetIdx) => {
    e.preventDefault();
    const movingIds = dragIndexRef.current;
    if (!movingIds || movingIds.length === 0) return;
    const targetItem = orderList[targetIdx];
    if (movingIds.includes(targetItem.id)) return;
    
    if (dragOverIndex !== targetIdx) {
      setDragOverIndex(targetIdx);
    }
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    const movingIds = dragIndexRef.current;
    if (!movingIds || movingIds.length === 0) return;
    const targetItem = orderList[targetIdx];
    if (movingIds.includes(targetItem.id)) return;
    
    setOrderList(prev => {
      const next = prev.filter(c => !movingIds.includes(c.id));
      const movingItems = movingIds.map(id => prev.find(c => c.id === id)).filter(Boolean);
      let insertIdx = next.findIndex(c => c.id === targetItem.id);
      if (insertIdx === -1) insertIdx = next.length;
      next.splice(insertIdx, 0, ...movingItems);
      return next;
    });
    dragIndexRef.current = null;
    setDragOverIndex(null);
    setSelectedOrderIds([]);
  };

  const handleDragEnd = () => { 
    dragIndexRef.current = null; 
    setDragOverIndex(null);
  };

  const toggleSelectOrder = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const handleSelectAll = () => {
    if (selectedOrderIds.length === orderList.length && orderList.length > 0) setSelectedOrderIds([]);
    else setSelectedOrderIds(orderList.map(c => c.id));
  };

  const saveOrder = async () => {
    if (!orderTester.trim()) {
      if (typeof setToast === 'function') setToast({ message: '请先输入测试人员名称', type: 'error' });
      return;
    }
    setOrderSaving(true);
    try {
      const res = await fetch(`${API_BASE}/case-orders/${encodeURIComponent(orderTester.trim())}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_ids: orderList.map(c => c.id) })
      });
      if (!res.ok) throw new Error();
      if (typeof setToast === 'function') setToast({ message: `${orderTester}的案例排序已更新`, type: 'success' });
      // Refresh tester list
      const updated = await fetch(`${API_BASE}/case-orders`).then(r=>r.json()).catch(()=>[]);
      setAllTesterOrders(Array.isArray(updated) ? updated : []);
    } catch { if (typeof setToast === 'function') setToast({ message: '保存失败', type: 'error' }); }
    finally { setOrderSaving(false); }
  };

  const resetOrder = async () => {
    if (!orderTester.trim()) return;
    if (!window.confirm(`确认清除测试人员${orderTester}的自定义排序，恢复默认ID顺序？`)) return;
    try {
      await fetch(`${API_BASE}/case-orders/${encodeURIComponent(orderTester.trim())}`, { method: 'DELETE' });
      setOrderList([...cases].sort((a, b) => Number(a.id) - Number(b.id)));
      setSelectedOrderIds([]);
      if (typeof setToast === 'function') setToast({ message: `${orderTester}的案例排序已恢复默认`, type: 'success' });
      const updated = await fetch(`${API_BASE}/case-orders`).then(r=>r.json()).catch(()=>[]);
      setAllTesterOrders(Array.isArray(updated) ? updated : []);
    } catch { if (typeof setToast === 'function') setToast({ message: '重置失败', type: 'error' }); }
  };

  // Form State
  const [formData, setFormData] = useState({
    id: '', category: '', functionCategory: '', type: '',
    function: '', expected: '', hint: ''
  });

  const uniqueFunctionCategories = [...new Set(cases.map(c => c.functionCategory || c.function_category).filter(Boolean))];

  const filteredCases = cases.filter(c => {
    if (!showInactive && c.is_active === 0) return false; // Show active only
    if (showInactive && c.is_active !== 0) return false;  // Show inactive only
    let match = true;
    if (filterCat && c.functionCategory !== filterCat && c.function_category !== filterCat) match = false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!c.function?.toLowerCase().includes(q) && !c.expected?.toLowerCase().includes(q)) match = false;
    }
    return match;
  }).sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || Number(a.id) - Number(b.id));

  const isEditing = cases.some(c => String(c.id) === String(formData.id));

  const handleAdd = () => {
    if (!formData.function || !formData.type) {
      if (typeof setToast === 'function') setToast({ message: '必填字段不完整', type: 'error' });
      return;
    }
    const newCase = { ...formData, id: formData.id ? String(formData.id) : undefined };
    fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCase)
    })
      .then(res => res.json())
      .then(saved => {
        const updatedCase = {
          id: saved.id || newCase.id,
          category: newCase.category,
          function_category: newCase.functionCategory,
          function: newCase.function,
          type: newCase.type,
          expected: newCase.expected,
          hint: newCase.hint
        };
        
        if (isEditing) {
          const newCases = cases.map(c => {
            if (String(c.id) === String(updatedCase.id)) {
              return { ...c, ...updatedCase };
            }
            return c;
          });
          const sorted = newCases.sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || Number(a.id) - Number(b.id));
          setCases(assignHierarchicalNumbers(sorted));
          if (typeof setToast === 'function') setToast({ message: '修改成功', type: 'success' });
        } else {
          const newCases = [...cases, updatedCase];
          const sorted = newCases.sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || Number(a.id) - Number(b.id));
          setCases(assignHierarchicalNumbers(sorted));
          if (typeof setToast === 'function') setToast({ message: '添加成功', type: 'success' });
        }
        setFormData({ id: '', category: '', functionCategory: '', type: '', function: '', expected: '', hint: '' });
      })
      .catch(err => {
         if (typeof setToast === 'function') setToast({ message: '操作失败', type: 'error' });
      });
  };

  const handleDelete = (id) => {
    fetch(`${API_BASE}/cases/${id}`, { method: 'DELETE' })
      .then(() => {
         const newCases = cases.filter(c => c.id !== id);
         setCases(assignHierarchicalNumbers(newCases));
         setDeleteConfirmId(null);
         if (typeof setToast === 'function') setToast({ message: '删除成功', type: 'success' });
      });
  };

  const handleToggleActive = (c) => {
    const newActiveState = c.is_active === 0 ? 1 : 0;
    fetch(`${API_BASE}/cases/${c.id}/toggle-active`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newActiveState })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(() => {
        const newCases = cases.map(caseItem => caseItem.id === c.id ? { ...caseItem, is_active: newActiveState } : caseItem);
        setCases(assignHierarchicalNumbers(newCases));
        if (typeof setToast === 'function') setToast({ message: newActiveState ? '已启用该案例' : '已停用该案例', type: 'success' });
      })
      .catch(err => {
         if (typeof setToast === 'function') setToast({ message: '操作失败', type: 'error' });
      });
  };

  const fileRef = useRef(null);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof setToast === 'function') setToast({ message: '正在解析...', type: 'info' });

    const reader = new FileReader();
    reader.onload = (evt) => {
      import('xlsx').then(XLSX => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length < 2) {
           if (typeof setToast === 'function') setToast({ message: '文件为空或格式错误', type: 'error' });
           return;
        }
        const headers = data[0];
        
        // Build column index map from headers for precise matching
        const colMap = {};
        headers.forEach((h, idx) => {
          const key = (h || '').toString().trim();
          if (key === 'id' || key.toUpperCase() === 'ID') colMap.id = idx;
          else if (key === '业务场景' || key.toLowerCase() === 'category') colMap.category = idx;
          else if (key === '功能大类' || key.toLowerCase() === 'function_category') colMap.functionCategory = idx;
          else if (key === '功能' || key.toLowerCase() === 'function') colMap.function = idx;
          else if (key === '描述' || key === '期望结果' || key.toLowerCase() === 'expected') colMap.expected = idx;
          else if (key === '类型' || key.toLowerCase() === 'type') colMap.type = idx;
          else if (key === '提示' || key === '备注' || key.toLowerCase() === 'hint') colMap.hint = idx;
        });

        const getCol = (row, field) => {
          const idx = colMap[field];
          return idx !== undefined ? String(row[idx] || '') : '';
        };

        const mappedCases = data.slice(1).map(row => {
          const typeRaw = getCol(row, 'type').toLowerCase();
          let type = 'simple';
          if (typeRaw.includes('timing')) type = 'timing';
          else if (typeRaw.includes('query')) type = 'query';
          else if (typeRaw.includes('simple')) type = 'simple';
          else if (typeRaw) type = getCol(row, 'type');

          return {
            id: getCol(row, 'id'),
            category: getCol(row, 'category'),
            functionCategory: getCol(row, 'functionCategory'),
            function: getCol(row, 'function'),
            expected: getCol(row, 'expected'),
            type,
            hint: getCol(row, 'hint'),
          };
        }).filter(c => c.function || c.expected);

        if (mappedCases.length > 0) {
          fetch(`${API_BASE}/cases/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mappedCases)
          }).then(res => {
             if (!res.ok) throw new Error('Bulk import failed');
             return res.json();
          }).then(() => {
             // Reload cases from server to get updated list with new IDs
             return fetch(`${API_BASE}/cases`);
          }).then(res => {
             if (!res.ok) throw new Error('Fetch cases failed');
             return res.json();
          }).then(freshCases => {
             import('../utils/caseNumbering.js').then(({ assignHierarchicalNumbers }) => {
               const sorted = [...freshCases].sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || Number(a.id) - Number(b.id));
               const numbered = assignHierarchicalNumbers(sorted);
               setCases(numbered);
             });
             if (typeof setToast === 'function') setToast({ message: `成功导入 ${mappedCases.length} 条记录`, type: 'success' });
          }).catch((err) => {
             console.error('Import error:', err);
             if (typeof setToast === 'function') setToast({ message: '导入失败: ' + (err.message || ''), type: 'error' });
          });
        } else {
           if (typeof setToast === 'function') setToast({ message: '未找到有效数据', type: 'error' });
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
      hint: c.hint || ''
    });
    // Scroll to top of the list container/main to see the form
    const mainEl = document.getElementById('admin-main-scroll');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1523] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <header className="px-[16px] pt-[44px] pb-[8px] w-full z-10 shrink-0 flex items-end justify-between">
        <h1 className="text-[26px] font-[800] text-slate-900 dark:text-white leading-none tracking-tight">案例管理</h1>
        {/* VIN 解析表导入- PC only */}
        <div className="hidden sm:flex items-center gap-[8px]">
          {vinRuleCount !== null && (
            <span className="text-[11px] font-[700] text-slate-400 dark:text-[#64748b]">{vinRuleCount} 条VIN 规则</span>
          )}
          <input type="file" accept=".xlsx,.xls" ref={vinFileRef} onChange={handleVinImport} className="hidden" />
          <button
            onClick={() => vinFileRef.current?.click()}
            className="flex items-center gap-[5px] bg-[#7c3aed]/10 border border-[#7c3aed]/30 hover:bg-[#7c3aed]/20 transition-colors rounded-[12px] px-[10px] py-[5px]"
          >
            <FileSpreadsheet size={13} className="text-[#a78bfa]" />
            <span className="text-[11px] font-[700] text-[#a78bfa]">VIN 解析表</span>
          </button>
        </div>
      </header>

      <main id="admin-main-scroll" className="flex-1 overflow-y-auto px-[16px] pt-[16px] pb-[100px] flex flex-col gap-[12px] custom-scrollbar">
        
        {/* Add Form DAuOP -> mWXyC */}
        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[16px] p-[12px] flex flex-col gap-[8px]">
          <span className="text-[12px] font-[900] text-slate-500 dark:text-[#94a3b8] px-[4px]">{isEditing ? '修改案例' : '新增案例'}</span>
          
          <div className="flex gap-[8px] w-full items-center">
            {isEditing && (
              <div className="shrink-0 min-w-[50px] px-[12px] bg-[#3b82f6]/20 border border-[#3b82f6]/30 rounded-[8px] h-[36px] flex items-center justify-center">
                 <span className="text-[13px] font-[900] text-[#60a5fa]">
                   {cases.find(c => String(c.id) === String(formData.id))?.case_number 
                     ? `Case ${cases.find(c => String(c.id) === String(formData.id)).case_number}` 
                     : `#${formData.id}`}
                 </span>
              </div>
            )}
            <input 
              placeholder="业务场景" className="flex-1 min-w-0 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[8px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6] placeholder:text-[12px] placeholder:font-normal text-[16px] font-[700]"
              value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
            />
            <input 
              placeholder="功能大类" className="w-[110px] shrink-0 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[8px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6] placeholder:text-[12px] placeholder:font-normal text-[16px] font-[700]"
              value={formData.functionCategory} onChange={e => setFormData({...formData, functionCategory: e.target.value})}
            />
          </div>

          <div className="flex gap-[8px] w-full">
             <input 
              placeholder="功能" className="flex-1 min-w-0 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[8px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6] placeholder:text-[12px] placeholder:font-normal text-[16px] font-[700]"
              value={formData.function} onChange={e => setFormData({...formData, function: e.target.value})}
             />
             <CustomSelect
               value={formData.type || ''}
               onChange={(val) => setFormData({...formData, type: val})}
               options={[
                 { value: 'timing', label: 'Timing' },
                 { value: 'query', label: 'Query' },
                 { value: 'simple', label: 'Simple' },
               ]}
               placeholder="案例类型"
               align="left"
               textColor="text-slate-900 dark:text-white text-[16px] font-[700]"
               className="w-[110px] shrink-0 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[8px]"
             />
          </div>

          <div className="w-full">
             <input 
              placeholder="期望结果" className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[8px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6] placeholder:text-[12px] placeholder:font-normal text-[16px] font-[700]"
              value={formData.expected} onChange={e => setFormData({...formData, expected: e.target.value})}
             />
          </div>

          <div className="w-full">
             <input 
              placeholder="操作提示（可选）" className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[8px] text-slate-900 dark:text-white focus:outline-none focus:border-[#3b82f6] placeholder:text-[12px] placeholder:font-normal text-[16px] font-[700]"
              value={formData.hint} onChange={e => setFormData({...formData, hint: e.target.value})}
             />
          </div>
          {isEditing ? (
             <div className="flex gap-[8px] mt-[4px] w-full">
               <button 
                 onClick={handleAdd} 
                 className="flex-1 bg-[#10b981] hover:bg-[#059669] transition-colors rounded-[12px] p-[10px] flex justify-center items-center gap-[6px]"
               >
                 <Save size={16} className="text-white" />
                 <span className="text-[12px] font-[900] text-white">保存修改</span>
               </button>
               <button 
                 onClick={() => setFormData({ id: '', category: '', functionCategory: '', type: '', function: '', expected: '', hint: '' })} 
                 className="w-[100px] shrink-0 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors rounded-[12px] p-[10px] flex justify-center items-center gap-[6px]"
               >
                 <X size={16} className="text-slate-500 dark:text-slate-400" />
                 <span className="text-[12px] font-[900] text-slate-600 dark:text-slate-300">取消</span>
               </button>
             </div>
           ) : (
             <button 
               onClick={handleAdd} 
               className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors rounded-[12px] p-[10px] flex justify-center items-center mt-[4px] gap-[6px]"
             >
                <PlusCircle size={16} className="text-white" />
                <span className="text-[12px] font-[900] text-white">添加案例</span>
             </button>
           )}
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[20px] p-[16px] flex flex-col gap-[12px] mt-[12px]">
           <span className="text-[12px] font-[900] text-slate-500 dark:text-[#94a3b8]">筛选案例</span>
           <div className="flex gap-[8px] w-full">
              <CustomSelect
                textColor="text-slate-900 dark:text-white text-[16px] font-[700]"
                value={filterCat}
                onChange={setFilterCat}
                options={[{value:'',label:'全部功能'}, ...uniqueFunctionCategories]}
                placeholder="按功能大类筛选"
                align="between"
                className="flex-1 min-w-0 w-1/2 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[12px]"
              />
              <input 
                placeholder="搜索功能名称..." className="flex-1 min-w-0 w-1/2 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-[8px] h-[36px] px-[12px] text-slate-900 dark:text-white focus:outline-none placeholder:text-[12px] placeholder:font-normal text-[16px] font-[700]"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* List Header */}
        <div className="flex justify-between items-center w-full h-[24px] shrink-0">
           <div className="flex items-center gap-[8px]">
             <span className="text-[12px] font-[900] text-slate-500 dark:text-[#94a3b8]">当前案例整({filteredCases.length})</span>
             <button 
               onClick={() => setShowInactive(!showInactive)} 
               className={`p-[4px] rounded-[6px] transition-colors border ${!showInactive ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
               title={!showInactive ? "当前：只显示启动案例 (点击查看停用案例)" : "当前：只显示停用案例 (点击查看启动案例)"}
             >
               {!showInactive ? <Eye size={14} /> : <EyeOff size={14} />}
             </button>
           </div>
           <div className="flex items-center gap-[6px]">
           <input type="file" accept=".xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden text-[16px] font-[700]" />
           <button onClick={() => fileRef.current?.click()} className="flex items-center gap-[4px] bg-[#059669]/20 border border-[#10b981]/30 hover:bg-[#059669]/30 transition-colors rounded-[12px] px-[8px] py-[4px]">
              <FolderOpen size={14} className="text-[#34d399]" />
              <span className="text-[11px] font-[700] text-[#34d399]">案例导入</span>
           </button>
           <button
             onClick={() => { setShowOrderPanel(true); setOrderTester(''); setOrderList([...cases].sort((a,b) => Number(a.id)-Number(b.id))); }}
             className="hidden md:flex items-center gap-[4px] bg-[#0284c7]/20 border border-[#0284c7]/30 hover:bg-[#0284c7]/30 transition-colors rounded-[12px] px-[8px] py-[4px]"
           >
             <ListOrdered size={14} className="text-[#38bdf8]" />
             <span className="text-[11px] font-[700] text-[#38bdf8]">个性化排序</span>
           </button>
           </div>
        </div>

        {/* Cases List */}
        <div className="flex flex-col gap-[8px]">
           {filteredCases.map(c => {
              const isActive = c.is_active !== 0;
              return (
              <div key={c.id} className={`bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#334155] rounded-[14px] p-[10px] px-[14px] flex justify-between items-center transition-all active:scale-[0.98] ${isActive ? '' : 'opacity-50 grayscale-[50%]'}`}>
                 <div className="flex flex-col gap-[4px] flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-[6px] h-[16px]">
                       <div className={`${isActive ? 'bg-[#3b82f6]/20 border-[#3b82f6]/30' : 'bg-slate-500/20 border-slate-500/30'} px-[6px] h-[16px] flex items-center justify-center rounded border`}>
                          <span className={`text-[10px] font-[800] ${isActive ? 'text-[#60a5fa]' : 'text-slate-500 dark:text-[#94a3b8]'} leading-none translate-y-[-0.5px]`}>{c.case_number ? `Case ${c.case_number}` : `#${c.id}`}</span>
                       </div>
                       <span className={`text-[10px] font-[800] ${isActive ? 'bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent' : 'text-slate-500 dark:text-[#94a3b8]'} truncate leading-[16px] mt-[0.5px]`}>
                         - {c.category ? `${c.category} - ` : ''}{c.functionCategory || c.function_category}
                       </span>
                    </div>
                    <div className="flex items-center gap-[6px] mt-0 overflow-hidden flex-wrap sm:flex-nowrap">
                       <span className={`text-[13px] font-[900] ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-[#94a3b8] line-through decoration-slate-400'} shrink-0`}>{c.function}</span>
                       {c.expected && <span className={`text-[11px] font-[500] ${isActive ? 'text-slate-700 dark:text-[#cbd5e1]' : 'text-slate-500 dark:text-[#64748b] line-through'} truncate shrink`}>- {c.expected}</span>}
                       <span className="text-[10px] font-[normal] text-[#64748b] shrink-0">| {c.type}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-[12px]">
                    <button onClick={() => handleEdit(c)} className="p-2 -mr-2 text-slate-500 dark:text-[#475569] hover:text-slate-900 dark:text-white transition-colors">
                       <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleToggleActive(c)} className="p-2 -mr-2 text-slate-500 dark:text-[#475569] hover:text-[#3b82f6] transition-colors" title={isActive ? "点击停用" : "点击启用"}>
                       {isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button onClick={() => setDeleteConfirmId(c.id)} className="p-2 -mr-2 text-[#ef4444] hover:text-red-400 transition-colors">
                       <X size={20} />
                    </button>
                 </div>
              </div>
           )})}
        </div>
      </main>

      <MobileNavigator currentView="admin" setView={setView} />

      {/* Custom Case Order Panel —PC only */}
      {showOrderPanel && (
        <div className="hidden sm:flex fixed inset-0 z-[60] bg-[#00000070] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative ml-auto h-full w-[520px] bg-white dark:bg-[#0f1523] border-l border-slate-200 dark:border-[#1e293b] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="px-[24px] pt-[32px] pb-[16px] border-b border-slate-200 dark:border-[#1e293b] flex items-start justify-between shrink-0">
              <div className="flex flex-col gap-[4px]">
                <span className="text-[18px] font-[900] text-slate-900 dark:text-white">个性化案例排序</span>
                <span className="text-[11px] font-[500] text-slate-400 dark:text-[#64748b]">拖拽调整顺序，每位测试人员可独立设置</span>
              </div>
              <button onClick={() => setShowOrderPanel(false)} className="p-[6px] rounded-[8px] hover:bg-slate-100 dark:hover:bg-[#1e293b] text-slate-500 dark:text-[#64748b] transition-colors mt-1">
                <X size={18} />
              </button>
            </div>

            {/* Tester Selector */}
            <div className="px-[24px] pt-[16px] pb-[12px] border-b border-slate-200 dark:border-[#1e293b] flex flex-col gap-[8px] shrink-0">
              <span className="text-[11px] font-[900] text-slate-400 dark:text-[#64748b] uppercase tracking-wide">测试人员</span>
              <div className="flex gap-[8px]">
                <input
                  placeholder="输入测试人员名称..."
                  value={orderTester}
                  onChange={e => setOrderTester(e.target.value)}
                  className="flex-1 h-[36px] px-[10px] bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-[8px] text-slate-900 dark:text-white text-[14px] font-[600] focus:outline-none focus:border-[#3b82f6] placeholder:text-[12px]"
                />
                <button
                  onClick={() => loadTesterOrder(orderTester.trim())}
                  disabled={!orderTester.trim() || orderLoading}
                  className="h-[36px] px-[12px] bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 rounded-[8px] text-[12px] font-[700] text-white transition-colors"
                >
                  {orderLoading ? '加载中..' : '载入'}
                </button>
              </div>
              {/* Quick pick from saved testers */}
              {allTesterOrders.length > 0 && (
                <div className="flex flex-wrap gap-[6px] mt-[2px]">
                  {allTesterOrders.map(t => (
                    <button
                      key={t.tester_name}
                      onClick={() => { setOrderTester(t.tester_name); loadTesterOrder(t.tester_name); }}
                      className={`px-[8px] h-[22px] rounded-[6px] border text-[10px] font-[700] transition-colors ${orderTester === t.tester_name ? 'bg-[#3b82f6]/20 border-[#3b82f6]/40 text-[#60a5fa]' : 'bg-slate-100 dark:bg-[#1e293b] border-slate-200 dark:border-[#334155] text-slate-500 dark:text-[#64748b] hover:border-[#3b82f6]/40 hover:text-[#60a5fa]'}`}
                    >
                      {t.tester_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Drag List */}
            <div className="flex-1 overflow-y-auto px-[24px] py-[12px] flex flex-col gap-[4px] custom-scrollbar">
              {orderLoading ? (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-[#64748b] text-[13px] font-[600]">加载中..</div>
              ) : orderList.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-[#64748b] text-[13px] font-[600]">请先选择测试人员后点击载入"</div>
              ) : (
                orderList.map((c, idx) => (
                  <React.Fragment key={c.id}>
                    {dragOverIndex === idx && (
                      <div 
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        className="h-[40px] border-2 border-dashed border-[#3b82f6]/50 bg-[#3b82f6]/5 rounded-[10px] flex items-center justify-center transition-all shadow-inner my-[2px]"
                      >
                        <span className="text-[#3b82f6] text-[12px] font-[800] tracking-wider">放入 {dragIndexRef.current?.length || 1} 个案例于此</span>
                      </div>
                    )}
                    <div
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, idx)}
                      onClick={() => toggleSelectOrder(c.id)}
                      className={`flex items-center gap-[10px] ${selectedOrderIds.includes(c.id) ? 'bg-[#3b82f6]/10 border-[#3b82f6]/40' : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-[#334155]'} border rounded-[10px] px-[10px] py-[8px] cursor-grab active:cursor-grabbing hover:border-[#3b82f6]/40 transition-all select-none group ${dragIndexRef.current?.includes(c.id) && dragOverIndex !== null ? 'opacity-30 scale-[0.98]' : ''}`}
                    >
                    <GripVertical size={14} className="text-slate-300 dark:text-[#475569] group-hover:text-[#3b82f6] shrink-0 transition-colors" />
                    <button onClick={(e) => toggleSelectOrder(c.id, e)} className={`shrink-0 transition-colors ${selectedOrderIds.includes(c.id) ? 'text-[#3b82f6]' : 'text-slate-300 dark:text-[#475569] group-hover:text-[#3b82f6]/50'}`}>
                      {selectedOrderIds.includes(c.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <div className="w-[28px] h-[18px] flex items-center justify-center bg-slate-100 dark:bg-[#0f172a] rounded-[4px] shrink-0">
                      <span className="text-[10px] font-[800] text-slate-400 dark:text-[#64748b]">{idx + 1}</span>
                    </div>
                    <div className="w-[36px] h-[18px] flex items-center justify-center bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-[4px] shrink-0">
                      <span className="text-[10px] font-[800] text-[#60a5fa]">#{c.id}</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-[6px] overflow-hidden">
                        <span className="text-[12px] font-[700] text-slate-900 dark:text-white shrink-0 leading-tight">{c.function}</span>
                        {c.expected && <span className="text-[11px] font-[500] text-slate-500 dark:text-[#94a3b8] truncate shrink">- {c.expected}</span>}
                      </div>
                      {(c.function_category || c.functionCategory) && (
                        <span className="text-[10px] font-[500] text-slate-400 dark:text-[#64748b] truncate leading-tight">{c.function_category || c.functionCategory}</span>
                      )}
                    </div>
                  </div>
                  </React.Fragment>
                ))
              )}
            </div>

            {/* Panel Footer Actions */}
            <div className="px-[24px] py-[16px] border-t border-slate-200 dark:border-[#1e293b] flex items-center justify-between gap-[8px] shrink-0">
              <div className="flex items-center gap-[8px]">
                <button
                  onClick={handleSelectAll}
                  disabled={orderList.length === 0}
                  className="flex items-center justify-center min-w-[60px] h-[36px] rounded-[10px] bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] text-[12px] font-[700] text-slate-600 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-[#334155] disabled:opacity-40 transition-colors"
                >
                  {selectedOrderIds.length === orderList.length && orderList.length > 0 ? '取消全选' : '全选'}
                </button>
                <button
                  onClick={resetOrder}
                  disabled={!orderTester.trim()}
                  className="flex items-center gap-[5px] px-[12px] h-[36px] rounded-[10px] bg-red-50 dark:bg-[#ef4444]/10 border border-red-200 dark:border-[#ef4444]/30 text-[12px] font-[700] text-red-500 dark:text-[#f87171] hover:bg-red-100 dark:hover:bg-[#ef4444]/20 disabled:opacity-40 transition-colors"
                >
                  <RotateCcw size={13} />
                  恢复默认
                </button>
              </div>
              <div className="flex gap-[8px]">
                <button
                  onClick={() => setShowOrderPanel(false)}
                  className="h-[36px] px-[16px] rounded-[10px] bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] text-[12px] font-[700] text-slate-600 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-[#334155] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveOrder}
                  disabled={orderSaving || orderList.length === 0 || !orderTester.trim()}
                  className="flex items-center gap-[5px] h-[36px] px-[16px] rounded-[10px] bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-[12px] font-[700] text-white transition-colors"
                >
                  {orderSaving ? (
                    <div className="w-[12px] h-[12px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  {orderSaving ? '保存中..' : '保存排序'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Dialog for Deletion */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000080] backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121826] shadow-sm dark:shadow-none border border-slate-200 dark:border-[#1e293b] rounded-[16px] p-[20px] w-full max-w-[320px] shadow-2xl flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[8px]">
              <span className="text-[18px] font-[900] text-slate-900 dark:text-white">确认删除案例：</span>
              <span className="text-[13px] font-[500] text-slate-500 dark:text-[#94a3b8] leading-snug">此操作不可恢复。案例的删除可能会影响相关历史执行记录的数据关联【</span>
            </div>
            <div className="flex justify-end gap-[12px] mt-[8px]">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-[16px] py-[8px] rounded-[10px] bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none hover:bg-slate-100 dark:hover:bg-[#334155] text-[13px] font-[800] text-slate-700 dark:text-[#cbd5e1] transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-[16px] py-[8px] rounded-[10px] bg-[#ef4444] hover:bg-red-500 text-[13px] font-[900] text-slate-900 dark:text-white shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-colors"
              >
                确认删除
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
