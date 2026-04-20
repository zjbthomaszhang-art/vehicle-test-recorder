import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_CASES, API_BASE } from './constants.js';
import { FIELD_LABELS } from './constants/labels.js';
import { createEmptyResult, compressImage } from './utils/formatters.js';
import { syncManager } from './utils/syncManager.js';
import { uploadPhoto } from './utils/photoUpload.js';

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

// Shared Components
import EditSessionModal from './components/EditSessionModal.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Toast from './components/Toast.jsx';
import MobileNavigator from './components/MobileNavigator.jsx';

export default function NDLBRecorder() {
  // --- View Routing ---
  const [view, setView] = useState('home'); // home | test | report | admin | history

  // --- Test Cases ---
  const [cases, setCases] = useState(INITIAL_CASES);

  // Load cases from backend on mount
  useEffect(() => {
    fetch(`${API_BASE}/cases`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort((a, b) => Number(a.id) - Number(b.id));
          setCases(sorted);
          setCaseResults(sorted.map(() => createEmptyResult()));
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
  const [mileage, setMileage] = useState('');

  // --- Session State ---
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [caseResults, setCaseResults] = useState(cases.map(() => createEmptyResult()));
  const [bugs, setBugs] = useState([]);

  // Track previous results refs for auto-save detection
  const prevResultsRef = useRef([]);
  const sessionIdRef = useRef(currentSessionId);
  useEffect(() => { sessionIdRef.current = currentSessionId; }, [currentSessionId]);
  const [historySessions, setHistorySessions] = useState([]);

  // --- UI Overlay State ---
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

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

  // Load history sessions when navigating to history view
  useEffect(() => {
    if (view === 'history') {
      fetch(`${API_BASE}/test-sessions`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setHistorySessions(data);
        })
        .catch(err => console.error('Failed to fetch history sessions:', err));
    }
  }, [view]);

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


  // Sync caseResults length when cases change
  useEffect(() => {
    if (caseResults.length !== cases.length) {
      setCaseResults(cases.map((_, i) => caseResults[i] || createEmptyResult()));
    }
  }, [cases]);

  const clearFormFields = () => {
    setVehicleModel(''); setModelYear(''); setVin(''); setAddress('');
    setArchitecture(''); setIviModule(''); setCommModule('');
    setProductionStage(''); setTestEnv('');
    setEnvPhotos([]);
    setTester(''); setMileage('');
  };

  // --- Global Actions ---
  const resetAllFields = () => {
    clearFormFields();
    setCaseResults(cases.map(() => createEmptyResult()));
    setBugs([]);
    setCurrentCaseIndex(0);
    setCurrentSessionId(null);
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
    // 1. Set vehicle fields immediately from the list data
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
    const raw = sess.env_photo;
    if (raw) {
      try { const p = JSON.parse(raw); setEnvPhotos(Array.isArray(p) ? p : []); }
      catch { setEnvPhotos([]); }
    } else {
      setEnvPhotos([]);
    }

    // 2. Fetch full session details to restore individual test results
    try {
      const res = await fetch(`${API_BASE}/test-sessions/${sess.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          // Map DB results back to caseResults format, keyed by case_id
          const resultMap = {};
          data.results.forEach(r => {
            resultMap[r.case_id] = {
              startTime: r.start_time ? new Date(r.start_time).getTime() : null,
              carExecTime: r.car_exec_time ? new Date(r.car_exec_time).getTime() : null,
              appFeedbackTime: r.app_feedback_time ? new Date(r.app_feedback_time).getTime() : null,
              result: r.result || '',
              notes: r.notes || '',
              media: [],
            };
          });
          const restored = cases.map(c => resultMap[c.id] || createEmptyResult());
          setCaseResults(restored);

          // 3. Jump to the first case that has no result yet
          const firstUntested = restored.findIndex(r => !r.result);
          setCurrentCaseIndex(firstUntested >= 0 ? firstUntested : 0);
        } else {
          setCaseResults(cases.map(() => createEmptyResult()));
          setCurrentCaseIndex(0);
        }
      } else {
        setCaseResults(cases.map(() => createEmptyResult()));
        setCurrentCaseIndex(0);
      }
    } catch (err) {
      console.error('Failed to load session results:', err);
      setCaseResults(cases.map(() => createEmptyResult()));
      setCurrentCaseIndex(0);
    }

    setCurrentSessionId(sess.id);
    setView('test');
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

  const buildSessionData = (sessionId = null) => ({
    sessionId: sessionId || currentSessionId,
    vehicle: { vehicleModel, model_year: modelYear, vin, production_stage: productionStage, address, architecture, iviModule, commModule, test_env: testEnv, envPhotos, tester, mileage },
    results: caseResults.map((res, idx) => ({
      case_id: cases[idx].id,
      start_time: res.startTime,
      car_exec_time: res.carExecTime,
      app_feedback_time: res.appFeedbackTime,
      result: res.result,
      notes: res.notes,
      media: res.media
    }))
  });

  // Silent auto-save (no toast, no loading indicator)
  const autoSave = () => {
    saveSession(true).catch(err => console.error('Auto-save failed:', err));
  };

  const saveSession = async (silent = false) => {
    const sessionData = buildSessionData();
    
    // Always add to local sync queue first for safety
    const localId = await syncManager.addToQueue(sessionData);
    updatePendingCount();

    if (!isOnline) {
      if (!silent) setToast({ message: '💾 已保存至本地。网络恢复后将自动同步。', type: 'info' });
      return Promise.resolve({ sessionId: 'offline-' + localId });
    }

    if (!silent) setIsSaving(true);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const url = currentSessionId ? `${API_BASE}/test-sessions/${currentSessionId}` : `${API_BASE}/test-sessions`;
        const method = currentSessionId ? 'PUT' : 'POST';
        
        fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        })
          .then(res => res.json())
          .then(async data => {
            if (data.sessionId && !currentSessionId) setCurrentSessionId(data.sessionId);
            
            // Success: remove from local sync queue
            await syncManager.remove(localId);
            updatePendingCount();
            
            if (!silent) setIsSaving(false);
            resolve(data);
          })
          .catch(err => {
            console.error('Sync failed, keeping locally:', err);
            if (!silent) {
              setIsSaving(false);
              setToast({ message: '📡 同步失败。数据已安全保存至本地。', type: 'info' });
            }
            resolve({ sessionId: 'offline-' + localId });
          });
      }, 50);
    });
  };

  const nextCase = () => {
    if (currentCaseIndex < cases.length - 1) {
      autoSave(); // auto-save on every next case
      setCurrentCaseIndex(prev => prev + 1);
    } else {
      setIsSaving(true);
      saveSession()
        .then(() => setView('report'))
        .catch(() => setView('report'))
        .finally(() => setIsSaving(false));
    }
  };

  const prevCase = () => {
    if (currentCaseIndex > 0) {
      setCurrentCaseIndex(prev => prev - 1);
    }
  };

  const saveTemporarily = () => {
    saveSession()
      .then(() => setToast({ message: '进度已临时保存', type: 'success' }))
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

    const activeCase = cases[currentCaseIndex];
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
        case_id: activeCase.id,
        description: currentData.notes || `[${activeCase.function}] Failed or Abnormal`,
        app_duration: appDur
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
            case_id: activeCase.id,
            description: currentData.notes || `[${activeCase.function}] Failed or Abnormal`,
            app_duration: appDur,
            id: response.id,
            display_id: bugLocalId,
            timestamp: ts,
            media: currentData.media || []   // ← capture photos taken during testing
          }];
          setToast({ message: `缺陷已提报 #${bugLocalId}`, type: 'success' });
          return updatedBugs;
        });
      })
      .catch(err => setToast({ message: '提报缺陷失败：' + err.message, type: 'error' }))
      .finally(() => setIsSaving(false));
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

    if (activePhotoTarget === 'env') {
      // Upload to server filesystem, get back a URL path
      const url = await uploadPhoto(file);
      if (url) setEnvPhotos(prev => [...prev, url]);
      else setToast({ message: '照片上传失败，请重试', type: 'error' });
    } else {
      // Case media: keep base64 for now
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        const id = Date.now();
        updateCurrentResult({ media: [...(caseResults[currentCaseIndex]?.media || []), { id, url: compressed, type: 'photo' }] });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Auto-create session when first entering test view (retries when back online) ---
  const isCreatingSessionRef = useRef(false);
  useEffect(() => {
    // Reset result tracking when entering test
    if (view === 'test') {
      prevResultsRef.current = caseResults.map(r => r.result);
    }
    // Create session if: on test view, online, no real session yet, not already creating
    if (view === 'test' && isOnline && !sessionIdRef.current && !isCreatingSessionRef.current) {
      isCreatingSessionRef.current = true;
      saveSession(true)
        .then(data => {
          const sid = data?.sessionId;
          if (sid && !String(sid).startsWith('offline-')) {
            setCurrentSessionId(sid);
            console.log('[AutoSession] Created:', sid);
          } else {
            console.warn('[AutoSession] No real session ID yet:', sid);
          }
        })
        .catch(err => console.error('[AutoSession] Failed:', err))
        .finally(() => { isCreatingSessionRef.current = false; });
    }
  }, [view, isOnline]); // isOnline added: retries when backend comes back up

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
    cases, caseResults, bugs,
    currentCaseIndex, setCurrentCaseIndex,
    vehicleModel, modelYear, vin,
    updateCurrentResult, handleTimeClick,
    handleAddMedia, convertToBug,
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
          envPhotos={envPhotos}
          setEnvPhotos={setEnvPhotos}
          testEnv={testEnv} setTestEnv={setTestEnv}
          tester={tester} setTester={setTester}
          mileage={mileage} setMileage={setMileage}
          handleAddMedia={handleAddMedia}
          setToast={setToast}
          setView={setView}
          resetAllFields={resetAllFields}
          setHistorySessions={setHistorySessions}
          API_BASE={API_BASE}
        />
      )}
      {view === 'test' && <TestView {...commonTestProps} />}
      {view === 'report' && (
        <ReportView
          cases={cases} caseResults={caseResults} bugs={bugs}
          vehicleModel={vehicleModel} modelYear={modelYear} vin={vin}
          productionStage={productionStage} testEnv={testEnv}
          address={address} architecture={architecture}
          iviModule={iviModule} commModule={commModule}
          tester={tester} mileage={mileage}
          envPhotos={envPhotos}
          setView={setView} handleFullReset={handleFullReset} setToast={setToast}
          setConfirmDialog={setConfirmDialog} resetAllFields={resetAllFields}
        />
      )}
      {view === 'admin' && (
        <AdminView cases={cases} setCases={setCases} setView={setView} setToast={setToast} />
      )}
      {view === 'dashboard' && (
        <DashboardView API_BASE={API_BASE} cases={cases} bugs={bugs} historySessions={historySessions} setView={setView} />
      )}
      {view === 'pdca' && (
        <DefectsView setView={setView} />
      )}
      {view === 'monitor' && (
        <PerformanceMonitorView setView={setView} />
      )}
      {view === 'history' && (
        <HistoryView
          historySessions={historySessions}
          totalCases={cases.length}
          setEditingSession={setEditingSession}
          onContinueSession={handleContinueSession}
          setView={setView}
        />
      )}

      {/* Global Overlays */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {isSaving && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
          <div className="relative">
             <div className="w-24 h-24 bg-blue-600/10 rounded-full border border-blue-500/20 animate-ping absolute inset-0" />
             <div className="w-24 h-24 bg-blue-600/20 rounded-full border border-blue-500/20 animate-pulse relative flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
             </div>
          </div>
          <p className="mt-12 text-2xl font-black text-white italic tracking-tighter uppercase animate-pulse">{FIELD_LABELS.syncingData}</p>
          <p className="mt-2 text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{FIELD_LABELS.processingTelemetry}</p>
        </div>
      )}

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSave={(updatedVehicle) => {
            setIsSaving(true);
            fetch(`${API_BASE}/test-sessions/${editingSession.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ vehicle: updatedVehicle, results: null })
            })
              .then(res => res.json())
              .then(() => {
                setToast({ message: '记录已更新', type: 'success' });
                setEditingSession(null);
                // Refresh history list
                fetch(`${API_BASE}/test-sessions`)
                  .then(r => r.json())
                  .then(data => { if (Array.isArray(data)) setHistorySessions(data); })
                  .catch(() => {});
              })
              .catch(err => setToast({ message: '更新失败: ' + err.message, type: 'error' }))
              .finally(() => setIsSaving(false));
          }}
          onDelete={(sessionId) => {
            setEditingSession(null);
            setIsSaving(true);
            fetch(`${API_BASE}/test-sessions/${sessionId}`, { method: 'DELETE' })
              .then(() => {
                setToast({ message: '记录已删除', type: 'success' });
                fetch(`${API_BASE}/test-sessions`)
                  .then(r => r.json())
                  .then(data => { if (Array.isArray(data)) setHistorySessions(data); })
                  .catch(() => {});
              })
              .catch(err => setToast({ message: '删除失败: ' + err.message, type: 'error' }))
              .finally(() => setIsSaving(false));
          }}
        />
      )}

      <input type="file" ref={photoInputRef} className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
      <Toast toast={toast} />

      {/* Global Mobile Navigator */}
      {['home', 'dashboard', 'history', 'admin', 'pdca'].includes(view) && (
        <MobileNavigator
          currentView={view}
          setView={setView}
          onTestPress={() => {
            if (view === 'home') {
              if (!vehicleModel || !vin || !tester || !mileage) {
                setToast({ message: '执行验证测试前，请先完善测试信息。', type: 'error' });
                return;
              }
              // Already on home — go straight to test
              setView('test');
            } else {
              // From any other view — clear only the form fields
              clearFormFields();
              setView('home');
            }
          }}
        />
      )}
    </>
  );
}
