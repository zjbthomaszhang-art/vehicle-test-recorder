import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_CASES, API_BASE } from './constants.js';
import { FIELD_LABELS } from './constants/labels.js';
import { createEmptyResult } from './utils/formatters.js';
import { syncManager } from './utils/syncManager.js';
import { uploadPhoto } from './utils/photoUpload.js';
import { assignHierarchicalNumbers } from './utils/caseNumbering.js';

// Views
import HomeView from './views/HomeView.jsx';
import TestView from './views/TestView.jsx';
import ReportView from './views/ReportView.jsx';
import DefectsView from './views/DefectsView.jsx';
import HistoryView from './views/HistoryView.jsx';
import DashboardView from './views/DashboardView.jsx';
import PDCAView from './views/PDCAView.jsx';
import PerformanceMonitorView from './views/PerformanceMonitorView.jsx';
import AdminView from './views/AdminView.jsx';
import MediaGalleryView from './views/MediaGalleryView.jsx';

// Shared Components
import EditSessionModal from './components/EditSessionModal.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Toast from './components/Toast.jsx';
import MobileNavigator from './components/MobileNavigator.jsx';
import QRCodeModal from './components/QRCodeModal.jsx';

export default function NDLBRecorder() {
  // --- View Routing ---
  const [view, setView] = useState('home'); // home | test | report | admin | history
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // --- Test Cases ---
  const [cases, setCases] = useState(INITIAL_CASES);
  // sessionCases: snapshot of cases bound to the current session (immutable after session creation)
  const [sessionCases, setSessionCases] = useState([]);

  // Load cases from backend on mount
  useEffect(() => {
    fetch(`${API_BASE}/cases`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || Number(a.id) - Number(b.id));
          const numbered = assignHierarchicalNumbers(sorted);
          setCases(numbered);
          setTestCases(numbered); // default: same as master
          setCaseResults(numbered.map(() => createEmptyResult()));
        }
      })
      .catch(err => console.error('Failed to fetch cases:', err));
  }, []);

  // --- Vehicle Info State ---
  const [vehicleModel, setVehicleModel] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [vin, setVin] = useState('');
  const [productionStage, setProductionStage] = useState('');
  const [address, setAddress] = useState('');
  const [architecture, setArchitecture] = useState('');
  const [iviModule, setIviModule] = useState('');
  const [commModule, setCommModule] = useState('');
  const [envPhotos, setEnvPhotos] = useState([]);
  const [testEnv, setTestEnv] = useState('');
  const [tester, setTester] = useState('');
  const [iosVersion, setIosVersion] = useState('');
  const [androidVersion, setAndroidVersion] = useState('');

  // testCases: cases ordered per tester's preference (used in TestView/ReportView)
  // cases: master list sorted by ID (used everywhere else)
  const [testCases, setTestCases] = useState([]);

  // Apply a tester's custom order to the master case list
  const applyTesterOrder = async (testerName, masterCases) => {
    if (!testerName) return masterCases;
    try {
      const res = await fetch(`${API_BASE}/case-orders/${encodeURIComponent(testerName)}`);
      if (!res.ok) return masterCases;
      const data = await res.json();
      const ids = data.case_ids;
      if (!Array.isArray(ids) || ids.length === 0) return masterCases;
      // Reorder: first pick cases matching saved order, append any unlisted ones at the end
      const idMap = new Map(masterCases.map(c => [String(c.id), c]));
      const ordered = ids.map(id => idMap.get(String(id))).filter(Boolean);
      const listed = new Set(ids.map(String));
      const remaining = masterCases.filter(c => !listed.has(String(c.id)));
      return [...ordered, ...remaining];
    } catch {
      return masterCases;
    }
  };
  const [mileage, setMileage] = useState('');
  const [remarks, setRemarks] = useState('');
  const [vinRules, setVinRules] = useState([]);

  // Load VIN rules from backend on mount
  useEffect(() => {
    fetch(`${API_BASE}/vin-rules`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setVinRules(data); })
      .catch(err => console.warn('Failed to load VIN rules:', err));
  }, []);

  // --- Session State ---
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [caseResults, setCaseResults] = useState(cases.map(() => createEmptyResult()));
  const [bugs, setBugs] = useState([]);

  // Track previous results refs for auto-save detection
  const prevResultsRef = useRef([]);
  const sessionIdRef = useRef(currentSessionId);
  const testCasesRef = useRef([]);  // always in sync with testCases state
  const saveQueueRef = useRef(Promise.resolve());
  useEffect(() => { sessionIdRef.current = currentSessionId; }, [currentSessionId]);
  useEffect(() => { testCasesRef.current = testCases; }, [testCases]);
  const [historySessions, setHistorySessions] = useState([]);
  const [allBugs, setAllBugs] = useState([]);
  const [topFailed, setTopFailed] = useState([]);

  // --- UI Overlay State ---
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [historyTargetId, setHistoryTargetId] = useState(null);
  const [defectsTargetSessionId, setDefectsTargetSessionId] = useState(null);

  // --- Network Status & Sync Logic ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      performFullSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check for pending items
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = async () => {
    const pending = await syncManager.getPending();
    setPendingSyncCount(pending.length);
  };

  const performFullSync = async () => {
    const pending = await syncManager.getPending();
    if (pending.length === 0) return;

    setToast({ message: `📡 网络已恢复。正同步 ${pending.length} 项数据...`, type: 'success' });
    
    for (const item of pending) {
      try {
        const isUpdate = !!item.data.sessionId;
        const url = isUpdate ? `${API_BASE}/test-sessions/${item.data.sessionId}` : `${API_BASE}/test-sessions`;
        const method = isUpdate ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        if (res.ok) {
          await syncManager.remove(item.localId);
        } else {
          const errorBody = await res.json().catch(() => ({}));
          console.error('Queued sync rejected by server:', errorBody.error || `HTTP ${res.status}`);
        }
      } catch (err) {
        console.error('Individual sync failed:', err);
      }
    }
    updatePendingCount();
  };

  // Reset scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Fetch history sessions and global bugs from server
  function fetchGlobalData() {
    const timestamp = Date.now();
    Promise.all([
      fetch(`${API_BASE}/test-sessions?t=${timestamp}`).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
      fetch(`${API_BASE}/bugs?t=${timestamp}`).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
      fetch(`${API_BASE}/cases/top-fails?t=${timestamp}`).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
    ]).then(([sessionsData, bugsData, topFailsData]) => {
      if (Array.isArray(sessionsData)) {
        setHistorySessions(prev => JSON.stringify(prev) === JSON.stringify(sessionsData) ? prev : sessionsData);
      }
      if (Array.isArray(bugsData)) {
        const sortedBugs = bugsData.sort((a, b) => new Date(String(b.timestamp || 0).replace(/-/g, '/')) - new Date(String(a.timestamp || 0).replace(/-/g, '/')));
        setAllBugs(prev => JSON.stringify(prev) === JSON.stringify(sortedBugs) ? prev : sortedBugs);
      }
      if (Array.isArray(topFailsData)) {
        setTopFailed(prev => JSON.stringify(prev) === JSON.stringify(topFailsData) ? prev : topFailsData);
      }
    }).catch(err => console.error('fetchGlobalData failed:', err));
  }

  // Fetch on first mount so Dashboard/History have data immediately
  useEffect(() => { fetchGlobalData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch whenever user enters history, dashboard, or pdca view
  useEffect(() => {
    if (view === 'history' || view === 'dashboard' || view === 'pdca') fetchGlobalData();
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Photo input ref (used for home page package/env photos)
  const photoInputRef = useRef(null);
  const [activePhotoTarget, setActivePhotoTarget] = useState(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);


  // Sync caseResults length on initial case load if results array is uninitialized
  useEffect(() => {
    const activeCases = testCases.length > 0 ? testCases : cases;
    if (activeCases.length > 0 && caseResults.length === 0) {
      setCaseResults(activeCases.map(() => createEmptyResult()));
    }
  }, [cases, testCases]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearFormFields = () => {
    setVehicleModel(''); setModelYear(''); setVin(''); setAddress('');
    setArchitecture(''); setIviModule(''); setCommModule('');
    setProductionStage(''); setTestEnv('');
    setEnvPhotos([]);
    setTester(''); setMileage(''); setRemarks('');
    setIosVersion(''); setAndroidVersion('');
  };

  // --- Global Actions ---
  const resetAllFields = () => {
    clearFormFields();
    setCaseResults(cases.map(() => createEmptyResult()));
    setBugs([]);
    setCurrentCaseIndex(0);
    setCurrentSessionId(null);
    setSessionCases([]);
  };

  const handleFullReset = () => {
    setConfirmDialog({
      title: '全部重置？ / Reset Everything?',
      message: '这将清除当前会话的所有数据并返回首页。 / This will clear all current session data and return home.',
      onConfirm: () => {
        resetAllFields();
        setView('home');
        setConfirmDialog(null);
        setToast({ message: '所有测试数据已重置。', type: 'success' });
      }
    });
  };

  // Continue an existing session from HistoryView — restores all fields + test results from DB
  const handleContinueSession = async (sess) => {
    if (!sess || !sess.id) return;
    setToast({ message: '正在加载测试会话数据...', type: 'info' });
    setIsSaving(true);

    try {
      setVehicleModel(sess.vehicle_model || '');
      setModelYear(sess.model_year || '');
      setVin(sess.vin || '');
      setProductionStage(sess.production_stage || '');
      setAddress(sess.address || sess.test_location || '');
      setArchitecture(sess.architecture || sess.vehicle_architecture || '');
      setIviModule(sess.ivi_module || '');
      setCommModule(sess.comm_module || '');
      setTestEnv(sess.test_env || '');
      setTester(sess.tester || '');
      setMileage(sess.mileage || '');
      setRemarks(sess.remarks || '');
      setIosVersion(sess.ios_version || '');
      setAndroidVersion(sess.android_version || '');
      const rawEnv = sess.envPhotos || sess.env_photo;
      if (Array.isArray(rawEnv)) {
        setEnvPhotos(rawEnv);
      } else if (typeof rawEnv === 'string') {
        try { const p = JSON.parse(rawEnv); setEnvPhotos(Array.isArray(p) ? p : []); }
        catch { setEnvPhotos([]); }
      } else {
        setEnvPhotos([]);
      }

      let data = {};
      try {
        const res = await fetch(`${API_BASE}/test-sessions/${sess.id}`);
        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {
        console.error('Fetch session details error:', e);
      }

      const masterCasesList = (cases && cases.length > 0) ? cases : INITIAL_CASES;

      let casesForSession;
      if (data.sessionCases && Array.isArray(data.sessionCases) && data.sessionCases.length > 0) {
        casesForSession = data.sessionCases.map(sc => ({
          ...sc,
          functionCategory: sc.function_category || sc.functionCategory || '',
        }));
        setSessionCases(casesForSession);
      } else {
        const ordered = await applyTesterOrder(sess.tester || '', masterCasesList);
        casesForSession = (ordered && ordered.length > 0) ? ordered : masterCasesList;
        setSessionCases([]);
      }

      setTestCases(casesForSession);

      if (data.results && Array.isArray(data.results)) {
        const parseTime = (t) => {
          if (!t) return null;
          if (typeof t === 'number') return isNaN(t) ? null : t;
          // Safari / WebKit on iOS strictly requires ISO-8601 with 'T' instead of space
          const s = String(t).trim().replace(' ', 'T');
          const parsed = new Date(s).getTime();
          return isNaN(parsed) ? null : parsed;
        };
        const resultMap = {};
        data.results.forEach(r => {
          const key = r.session_case_id || r.case_id;
          if (key) resultMap[key] = {
            startTime: parseTime(r.start_time),
            carExecTime: parseTime(r.car_exec_time),
            appFeedbackTime: parseTime(r.app_feedback_time),
            result: r.result || '',
            notes: r.notes || '',
            media: r.media || [],
          };
        });
        const restored = casesForSession.map(c => {
          return resultMap[c.id] || resultMap[c.original_case_id] || createEmptyResult();
        });
        setCaseResults(restored);
        const firstUntested = restored.findIndex(r => !r.result);
        setCurrentCaseIndex(firstUntested >= 0 ? firstUntested : 0);
      } else {
        setCaseResults(casesForSession.map(() => createEmptyResult()));
        setCurrentCaseIndex(0);
      }

      const loadedBugs = (data.bugs && Array.isArray(data.bugs)) ? data.bugs : [];
      const fallbackBugs = allBugs.filter(b => String(b.session_id) === String(sess.id)).reverse();
      setBugs(loadedBugs.length > 0 ? loadedBugs : fallbackBugs);

      setCurrentSessionId(sess.id);
      setView('test');
    } catch (err) {
      console.error('handleContinueSession error:', err);
      setToast({ message: '加载测试会话失败: ' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Test Session Actions ---
  const updateCurrentResult = (updates) => {
    setCaseResults(prev => {
      const next = [...prev];
      next[currentCaseIndex] = { ...next[currentCaseIndex], ...updates };
      return next;
    });
  };

  const handleTimeClick = (type) => {
    const now = Date.now();
    if (type === 'start') updateCurrentResult({ startTime: now });
    if (type === 'car') updateCurrentResult({ carExecTime: now });
    if (type === 'app') updateCurrentResult({ appFeedbackTime: now });
  };

  const buildSessionData = (sessionId = null) => {
    const activeCases = testCasesRef.current.length > 0 ? testCasesRef.current : cases;
    // Prefer session_case_id (snapshot ID) over original case_id
    return {
      sessionId: sessionId || currentSessionId,
      vehicle: { vehicleModel, model_year: modelYear, vin, production_stage: productionStage, address, architecture, iviModule, commModule, test_env: testEnv, envPhotos, tester, mileage, remarks, iosVersion, androidVersion },
      results: caseResults.map((res, idx) => {
        const c = activeCases[idx] || cases[idx];
        return {
          case_id: c?.original_case_id || c?.id,          // original case library ID
          session_case_id: c?.original_case_id ? c.id : null, // snapshot ID (only set if using sessionCases)
          start_time: (res.startTime && !isNaN(res.startTime)) ? res.startTime : null,
          car_exec_time: (res.carExecTime && !isNaN(res.carExecTime)) ? res.carExecTime : null,
          app_feedback_time: (res.appFeedbackTime && !isNaN(res.appFeedbackTime)) ? res.appFeedbackTime : null,
          result: res.result,
          notes: res.notes,
          media: Array.isArray(res.media) ? res.media : []
        };
      })
    };
  };

  // Silent auto-save (no toast, no loading indicator)
  const autoSave = () => {
    saveSession(true).catch(err => console.error('Auto-save failed:', err));
  };

  const saveSession = async (silent = false) => {
    // Add to queue to prevent race conditions on rapid saves (e.g., clicking "Next Case" repeatedly)
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      // Use sessionIdRef.current to ensure we get the absolute latest ID, even if React state is lagging
      const currentId = sessionIdRef.current;
      const sessionData = buildSessionData(currentId);
      
      // Always add to local sync queue first for safety
      const localId = await syncManager.addToQueue(sessionData);
      updatePendingCount();

      if (!isOnline) {
        if (!silent) setToast({ message: '💾 已保存至本地。网络恢复后将自动同步。', type: 'info' });
        return { sessionId: 'offline-' + localId, queued: true };
      }

      if (!silent) setIsSaving(true);
      return new Promise((resolve) => {
        const url = currentId ? `${API_BASE}/test-sessions/${currentId}` : `${API_BASE}/test-sessions`;
        const method = currentId ? 'PUT' : 'POST';
        
        // Add 30-second timeout to prevent hanging requests
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 30000);
        
        fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
          signal: controller.signal
        })
          .then(async res => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(data.error || data.message || `HTTP ${res.status}`);
            }
            return data;
          })
          .then(async data => {
            clearTimeout(fetchTimeout);
            if (data.sessionId && !currentId) {
              setCurrentSessionId(data.sessionId);
              // Update ref immediately so subsequent queued saves use PUT instead of POST
              sessionIdRef.current = data.sessionId;
            }
            
            // Success: remove from local sync queue
            await syncManager.remove(localId);
            updatePendingCount();
            
            if (!silent) setIsSaving(false);
            resolve(data);
          })
          .catch(err => {
            clearTimeout(fetchTimeout);
            console.error('Sync failed, keeping locally:', err);
            if (!silent) {
              setIsSaving(false);
              setToast({ message: '📡 同步失败。数据已安全保存至本地。', type: 'info' });
            }
            resolve({ sessionId: 'offline-' + localId, queued: true });
          });
      });
    }).catch(err => {
      console.error('Save queue error:', err);
      return { error: err };
    });

    return saveQueueRef.current;
  };

  const nextCase = () => {
    const activeCases = testCasesRef.current.length > 0 ? testCasesRef.current : cases;
    if (currentCaseIndex < activeCases.length - 1) {
      autoSave(); // auto-save on every next case
      setCurrentCaseIndex(prev => prev + 1);
    } else {
      // Use the same durable queue as regular saves so a failed final request is retained locally.
      saveSession(false).finally(() => setView('report'));
    }
  };

  const prevCase = () => {
    if (currentCaseIndex > 0) {
      setCurrentCaseIndex(prev => prev - 1);
    }
  };

  const saveTemporarily = () => {
    saveSession()
      .then(result => {
        if (result?.error) throw result.error;
        if (result?.queued) {
          setToast({ message: '数据已保存到本地，网络恢复后将自动同步。', type: 'info' });
        } else {
          setToast({ message: '进度已临时保存', type: 'success' });
        }
      })
      .catch(err => setToast({ message: '保存失败: ' + err.message, type: 'error' }));
  };

  const convertToBug = async () => {
    let realSessionId = sessionIdRef.current;

    // If no real session ID yet, try to create one now (handles offline-at-entry case)
    if (!realSessionId || String(realSessionId).startsWith('offline-')) {
      setToast({ message: '正在创建会话，请稍候...', type: 'info' });
      try {
        const data = await saveSession(false);
        const sid = data?.sessionId;
        if (sid && !String(sid).startsWith('offline-')) {
          setCurrentSessionId(sid);
          sessionIdRef.current = sid;
          realSessionId = sid;
        } else {
          setToast({ message: '网络未连接，无法提报缺陷，请检查网络后重试。', type: 'error' });
          return;
        }
      } catch (err) {
        setToast({ message: '会话创建失败，请检查网络连接。', type: 'error' });
        return;
      }
    }

    const activeCaseList = testCasesRef.current.length > 0 ? testCasesRef.current : cases;
    const activeCase = activeCaseList[currentCaseIndex];
    const currentData = caseResults[currentCaseIndex];

    if (!currentData.notes || currentData.notes.trim() === '') {
      setToast({ message: '请填写备注描述后再提报缺陷', type: 'error' });
      return;
    }

    const startMs = currentData.startTime ? new Date(currentData.startTime).getTime() : null;
    const appMs = currentData.appFeedbackTime ? new Date(currentData.appFeedbackTime).getTime() : null;
    const appDur = (startMs && appMs) ? `${((appMs - startMs) / 1000).toFixed(2)}s` : 'N/A';

    setIsSaving(true);
    fetch(`${API_BASE}/bugs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionIdRef.current,
        case_id: activeCase.original_case_id || activeCase.id,
        session_case_id: activeCase.original_case_id ? activeCase.id : null,
        description: currentData.notes,
        app_duration: appDur,
        media: currentData.media || []   // ← persist photos/evidence to DB
      })
    })
      .then(async res => {
        // Safely parse JSON — server may return empty body on success
        const text = await res.text();
        let response = {};
        try { response = text ? JSON.parse(text) : {}; } catch (_) {}
        if (!res.ok) throw new Error(response.error || `HTTP ${res.status}`);
        return response;
      })
      .then(response => {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        setBugs(prev => {
          const bugLocalId = prev.length + 1;
          const updatedBugs = [...prev, {
            session_id: sessionIdRef.current,
            case_id: activeCase.original_case_id || activeCase.id,
            session_case_id: activeCase.original_case_id ? activeCase.id : null,
            description: currentData.notes || `[${activeCase.function}] Failed or Abnormal`,
            app_duration: appDur,
            id: response.id,
            display_id: bugLocalId,
            timestamp: ts,
            media: currentData.media || [],   // ← capture photos taken during testing
            function: activeCase.function,
            function_category: activeCase.function_category || activeCase.functionCategory
          }];
          setToast({ message: `缺陷已提报 #${bugLocalId}`, type: 'success' });
          return updatedBugs;
        });
      })
      .catch(err => setToast({ message: '提报缺陷失败：' + err.message, type: 'error' }))
      .finally(() => setIsSaving(false));
  };

  const deleteBug = async (bugId) => {
    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE}/bugs/${bugId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setBugs(prev => prev.filter(b => b.id !== bugId));
      setAllBugs(prev => prev.filter(b => b.id !== bugId));
      setToast({ message: '缺陷已删除', type: 'success' });
      // Trigger a re-fetch to ensure global state is perfectly synced
      fetchGlobalData();
    } catch (err) {
      setToast({ message: '删除失败：' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateBug = async (bugId, updates) => {
    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE}/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setBugs(prev => prev.map(b => b.id === bugId ? { ...b, ...updates } : b));
      setAllBugs(prev => prev.map(b => b.id === bugId ? { ...b, ...updates } : b));
      setToast({ message: '缺陷已更新', type: 'success' });
    } catch (err) {
      setToast({ message: '更新失败：' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Home Photo Upload ---
  const handleAddMedia = (target = 'general') => {
    setActivePhotoTarget(target);
    photoInputRef.current?.click();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    setToast({ message: '照片上传中...', type: 'info' });
    const url = await uploadPhoto(file);
    if (!url) {
      setToast({ message: '照片上传失败，请重试', type: 'error' });
      return;
    }

    if (activePhotoTarget === 'env') {
      setEnvPhotos(prev => [...prev, url]);
      setToast({ message: '车况照片已添加', type: 'success' });
    } else {
      const id = Date.now();
      updateCurrentResult({ media: [...(caseResults[currentCaseIndex]?.media || []), { id, name: file.name, url, type: 'photo' }] });
      setToast({ message: '测试截图已添加', type: 'success' });
    }
  };

  // --- Auto-create session when first entering test view ---
  const isCreatingSessionRef = useRef(false);
  useEffect(() => {
    if (view === 'test') {
      prevResultsRef.current = caseResults.map(r => r.result);
    }
    if (view === 'test' && isOnline && !sessionIdRef.current && !isCreatingSessionRef.current) {
      isCreatingSessionRef.current = true;
      saveSession(true)
        .then(data => {
          const sid = data?.sessionId;
          if (sid && !String(sid).startsWith('offline-')) {
            setCurrentSessionId(sid);
            // Store the session_cases snapshot returned from the server
            if (data.sessionCases && Array.isArray(data.sessionCases)) {
              const snapshotCases = data.sessionCases.map(sc => ({
                ...sc,
                functionCategory: sc.function_category,
              }));
              setSessionCases(snapshotCases);
              setTestCases(snapshotCases);
              setCaseResults(snapshotCases.map((_, i) => caseResults[i] || createEmptyResult()));
            }
            console.log('[AutoSession] Created:', sid, 'with', data.sessionCases?.length, 'snapshot cases');
          }
        })
        .catch(err => console.error('[AutoSession] Failed:', err))
        .finally(() => { isCreatingSessionRef.current = false; });
    }
  }, [view, isOnline]);

  // --- Auto-save when any case result (verdict) changes ---
  useEffect(() => {
    if (view !== 'test' || !sessionIdRef.current) return;
    const currentResults = caseResults.map(r => r.result);
    const prev = prevResultsRef.current;
    const changed = prev.length > 0 && currentResults.some((r, i) => r !== prev[i]);
    prevResultsRef.current = currentResults;
    if (!changed) return;
    // Debounce to let React flush state before saving
    const timer = setTimeout(() => {
      autoSave();
    }, 400);
    return () => clearTimeout(timer);
  }, [caseResults, view]);

  // --- Route to correct view ---
  const commonTestProps = {
    cases: (testCases && testCases.length > 0) ? testCases : (cases && cases.length > 0 ? cases : INITIAL_CASES), caseResults, bugs,
    currentCaseIndex, setCurrentCaseIndex,
    vehicleModel, modelYear, vin,
    updateCurrentResult, handleTimeClick,
    handleAddMedia, convertToBug, deleteBug, updateBug,
    nextCase, prevCase, saveTemporarily, autoSave,
    setConfirmDialog, setView, resetAllFields, setToast,
    isOnline, pendingSyncCount
  };

  return (
    <>
      {view === 'home' && (
        <HomeView
          vehicleModel={vehicleModel} setVehicleModel={setVehicleModel}
          modelYear={modelYear} setModelYear={setModelYear}
          vin={vin} setVin={setVin}
          productionStage={productionStage} setProductionStage={setProductionStage}
          address={address} setAddress={setAddress}
          architecture={architecture} setArchitecture={setArchitecture}
          iviModule={iviModule} setIviModule={setIviModule}
          commModule={commModule} setCommModule={setCommModule}
          iosVersion={iosVersion} setIosVersion={setIosVersion}
          androidVersion={androidVersion} setAndroidVersion={setAndroidVersion}
          envPhotos={envPhotos}
          setEnvPhotos={setEnvPhotos}
          testEnv={testEnv} setTestEnv={setTestEnv}
          tester={tester} setTester={setTester}
          mileage={mileage} setMileage={setMileage}
        remarks={remarks} setRemarks={setRemarks}
          vinRules={vinRules}
          handleAddMedia={handleAddMedia}
          setToast={setToast}
          setView={setView}
          resetAllFields={resetAllFields}
          setHistorySessions={setHistorySessions}
          API_BASE={API_BASE}
          onOpenQrModal={() => setIsQrModalOpen(true)}
        />
      )}
      {view === 'test' && <TestView {...commonTestProps} />}
      {view === 'report' && (
        <ReportView
          cases={testCases} caseResults={caseResults} bugs={bugs}
          vehicleModel={vehicleModel} modelYear={modelYear} vin={vin}
          productionStage={productionStage} testEnv={testEnv}
          address={address} architecture={architecture}
          iviModule={iviModule} commModule={commModule}
          tester={tester} mileage={mileage}
          iosVersion={iosVersion} androidVersion={androidVersion}
          envPhotos={envPhotos}
          setCurrentCaseIndex={setCurrentCaseIndex}
          setView={setView} handleFullReset={handleFullReset} setToast={setToast}
          setConfirmDialog={setConfirmDialog} resetAllFields={resetAllFields}
        />
      )}
      {view === 'admin' && (
        <AdminView cases={cases} setCases={setCases} setView={setView} setToast={setToast} API_BASE={API_BASE} onOpenQrModal={() => setIsQrModalOpen(true)} />
      )}
      {view === 'dashboard' && (
        <DashboardView API_BASE={API_BASE} cases={cases} bugs={allBugs} historySessions={historySessions} topFailed={topFailed} setView={setView} setDefectsTargetSessionId={setDefectsTargetSessionId} onOpenQrModal={() => setIsQrModalOpen(true)} />
      )}
      {view === 'pdca' && (
        <DefectsView
          cases={cases}
          bugs={allBugs}
          setAllBugs={setAllBugs}
          historySessions={historySessions}
          API_BASE={API_BASE}
          setView={setView}
          targetSessionId={defectsTargetSessionId}
          clearTargetSessionId={() => setDefectsTargetSessionId(null)}
        />
      )}
      {view === 'monitor' && (
        <PerformanceMonitorView setView={setView} />
      )}
      {view === 'media' && (
        <MediaGalleryView setView={setView} setHistoryTargetId={setHistoryTargetId} />
      )}
      {view === 'history' && (
        <HistoryView
          historySessions={historySessions}
          totalCases={cases.length}
          setEditingSession={setEditingSession}
          onContinueSession={handleContinueSession}
          setView={setView}
          targetSessionId={historyTargetId}
          clearTargetSessionId={() => setHistoryTargetId(null)}
          setDefectsTargetSessionId={setDefectsTargetSessionId}
        />
      )}

      {/* Global Overlays */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
      <QRCodeModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} setToast={setToast} />

      {isSaving && (
        <div className="fixed inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-[999] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
          <div className="relative">
             <div className="w-24 h-24 bg-blue-600/10 rounded-full border border-blue-500/20 animate-ping absolute inset-0" />
             <div className="w-24 h-24 bg-blue-600/20 rounded-full border border-blue-500/20 animate-pulse relative flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
             </div>
          </div>
          <p className="mt-12 text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase animate-pulse">{FIELD_LABELS.syncingData}</p>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">{FIELD_LABELS.processingTelemetry}</p>
        </div>
      )}

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          vinRules={vinRules}
          onClose={() => setEditingSession(null)}
          onSave={async (updatedVehicle) => {
            setIsSaving(true);
            try {
              const res = await fetch(`${API_BASE}/test-sessions/${editingSession.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicle: updatedVehicle, results: null })
              });
              
              if (!res.ok) {
                 const errText = await res.text();
                 throw new Error(errText || `HTTP ${res.status}`);
              }

              // ✅ 保存成功：立即更新本地缓存（乐观更新），消除网络延迟感
              setHistorySessions(prev => 
                prev.map(s => s.id === editingSession.id ? { ...s, ...updatedVehicle, ios_version: updatedVehicle.iosVersion, android_version: updatedVehicle.androidVersion } : s)
              );

              setIsSaving(false);
              setEditingSession(null);
              setView('history');
              setToast({ message: '记录已更新', type: 'success' });

              // 后台静默刷新历史列表（确保数据一致性）
              fetchGlobalData();

            } catch (err) {
              setIsSaving(false);
              setToast({ message: '更新失败: ' + err.message, type: 'error' });
            }
          }}
          onDelete={async (sessionId) => {
            setIsSaving(true);
            try {
              const delRes = await fetch(`${API_BASE}/test-sessions/${sessionId}`, { method: 'DELETE' });
              if (!delRes.ok) throw new Error(`HTTP ${delRes.status}`);

              // ✅ 删除成功：立即更新本地缓存（乐观更新），消除网络延迟感
              setHistorySessions(prev => prev.filter(s => s.id !== sessionId));

              setIsSaving(false);
              setEditingSession(null);
              setView('history');
              setToast({ message: '记录已删除', type: 'success' });

              // 后台静默刷新历史列表
              fetchGlobalData();

            } catch (err) {
              setIsSaving(false);
              setToast({ message: '删除失败: ' + err.message, type: 'error' });
            } finally {
              setIsSaving(false);
            }
          }}
        />
      )}

      <input type="file" ref={photoInputRef} className="hidden text-[16px] font-[700]" accept="image/*" onChange={handlePhotoUpload} />
      <Toast toast={toast} />

      {/* Global Mobile Navigator */}
      {['home', 'dashboard', 'history', 'admin', 'pdca'].includes(view) && (
        <MobileNavigator
          currentView={view}
          setView={setView}
          onTestPress={async () => {
            if (view === 'home') {
              if (!vehicleModel || !vin || !tester || !mileage) {
                setToast({ message: '执行验证测试前，请先完善测试信息。', type: 'error' });
                return;
              }
              // Apply tester's custom case order before entering test
              // Note: session_cases snapshot will be created & returned when saveSession fires
              const ordered = await applyTesterOrder(tester, cases);
              setTestCases(ordered);
              setSessionCases([]);   // will be populated after auto-session creation
              setCaseResults(ordered.map(() => createEmptyResult()));
              setCurrentCaseIndex(0);
              setView('test');
            } else {
              clearFormFields();
              setView('home');
            }
          }}
        />
      )}
    </>
  );
}
