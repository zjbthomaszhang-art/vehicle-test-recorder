import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_CASES, API_BASE } from './constants.js';
import { FIELD_LABELS } from './constants/labels.js';
import { createEmptyResult, compressImage } from './utils/formatters.js';
import { syncManager } from './utils/syncManager.js';

// Views
import HomeView from './views/HomeView.jsx';
import TestView from './views/TestView.jsx';
import ReportView from './views/ReportView.jsx';
import AdminView from './views/AdminView.jsx';
import HistoryView from './views/HistoryView.jsx';
import DashboardView from './views/DashboardView.jsx';
import PDCAView from './views/PDCAView.jsx';

// Shared Components
import EditSessionModal from './components/EditSessionModal.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Toast from './components/Toast.jsx';

export default function NDLBRecorder() {
  // --- View Routing ---
  const [view, setView] = useState('home'); // home | test | report | admin | history

  // --- Test Cases ---
  const [cases, setCases] = useState(INITIAL_CASES);

  // Load cases from backend on mount
  useEffect(() => {
    fetch(`${API_BASE}/cases`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
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
  const [address, setAddress] = useState('');
  const [architecture, setArchitecture] = useState('');
  const [iviModule, setIviModule] = useState('');
  const [commModule, setCommModule] = useState('');
  const [packagePhoto, setPackagePhoto] = useState(null);
  const [envPhoto, setEnvPhoto] = useState(null);
  const [tester, setTester] = useState('');
  const [mileage, setMileage] = useState('');

  // --- Session State ---
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [caseResults, setCaseResults] = useState(cases.map(() => createEmptyResult()));
  const [bugs, setBugs] = useState([]);
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

    setToast({ message: `📡 网络已恢复。正同步 ${pending.length} 项数据... / Network restored. Syncing ${pending.length} items...`, type: 'success' });
    
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

  // --- Global Actions ---
  const resetAllFields = () => {
    setVehicleModel(''); setModelYear(''); setVin(''); setAddress('');
    setArchitecture(''); setIviModule(''); setCommModule('');
    setPackagePhoto(null); setEnvPhoto(null);
    setTester(''); setMileage('');
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
        setToast({ message: '所有测试数据已重置。 / All test data has been reset.', type: 'success' });
      }
    });
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
    vehicle: { vehicleModel, model_year: modelYear, vin, address, architecture, iviModule, commModule, packagePhoto, envPhoto, tester, mileage },
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

  const saveSession = async () => {
    const sessionData = buildSessionData();
    
    // Always add to local sync queue first for safety
    const localId = await syncManager.addToQueue(sessionData);
    updatePendingCount();

    if (!isOnline) {
      setToast({ message: '💾 已保存至本地。网络恢复后将自动同步。 / Saved locally. Will sync later.', type: 'info' });
      return Promise.resolve({ sessionId: 'offline-' + localId });
    }

    setIsSaving(true);
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
            
            setIsSaving(false);
            resolve(data);
          })
          .catch(err => {
            console.error('Sync failed, keeping locally:', err);
            setIsSaving(false);
            // Don't reject, we saved locally already
            setToast({ message: '📡 同步失败。数据已安全保存至本地。 / Sync failed. Data is safe locally.', type: 'info' });
            resolve({ sessionId: 'offline-' + localId });
          });
      }, 50);
    });
  };

  const nextCase = () => {
    if (currentCaseIndex < cases.length - 1) {
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
      .then(() => setToast({ message: '进度已临时保存。 / Progress saved temporarily.', type: 'success' }))
      .catch(err => setToast({ message: '保存失败 / Save failed: ' + err.message, type: 'error' }));
  };

  const convertToBug = () => {
    if (!currentSessionId) {
      setToast({ message: '请先保存一次进度获取会话 ID。 / Please save once to get session ID.', type: 'error' });
      return;
    }
    const activeCase = cases[currentCaseIndex];
    const currentData = caseResults[currentCaseIndex];

    if (!currentData.notes || currentData.notes.trim() === '') {
      setToast({ message: '请在提交 Bug 前填写描述 / Please fill description before bug submission', type: 'error' });
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
        session_id: currentSessionId,
        case_id: activeCase.id,
        description: currentData.notes || `[${activeCase.function}] Failed or Abnormal`,
        app_duration: appDur
      })
    })
      .then(res => res.json())
      .then(response => {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        setBugs(prev => {
          const bugLocalId = prev.length + 1;
          const updatedBugs = [...prev, { session_id: currentSessionId, case_id: activeCase.id, description: currentData.notes || `[${activeCase.function}] Failed or Abnormal`, app_duration: appDur, id: response.id, display_id: bugLocalId, timestamp: ts }];
          setToast({ message: `Bug captured: #${bugLocalId}`, type: 'success' });
          return updatedBugs;
        });
      })
      .catch(err => setToast({ message: 'Failed to save bug: ' + err.message, type: 'error' }))
      .finally(() => setIsSaving(false));
  };

  // --- Home Photo Upload ---
  const handleAddMedia = (target = 'general') => {
    setActivePhotoTarget(target);
    photoInputRef.current?.click();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result);
      if (activePhotoTarget === 'package') {
        setPackagePhoto(compressed);
      } else if (activePhotoTarget === 'env') {
        setEnvPhoto(compressed);
      } else {
        // general: add to current case media
        const id = Date.now();
        updateCurrentResult({ media: [...(caseResults[currentCaseIndex]?.media || []), { id, url: compressed, type: 'photo' }] });
      }
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  // --- Route to correct view ---
  const commonTestProps = {
    cases, caseResults, bugs,
    currentCaseIndex, setCurrentCaseIndex,
    vehicleModel, modelYear, vin,
    updateCurrentResult, handleTimeClick,
    handleAddMedia, convertToBug,
    nextCase, prevCase, saveTemporarily,
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
          address={address} setAddress={setAddress}
          architecture={architecture} setArchitecture={setArchitecture}
          iviModule={iviModule} setIviModule={setIviModule}
          commModule={commModule} setCommModule={setCommModule}
          packagePhoto={packagePhoto} envPhoto={envPhoto}
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
          address={address} architecture={architecture}
          iviModule={iviModule} commModule={commModule}
          tester={tester} mileage={mileage}
          packagePhoto={packagePhoto} envPhoto={envPhoto}
          setView={setView} handleFullReset={handleFullReset}
        />
      )}
      {view === 'admin' && (
        <AdminView cases={cases} setCases={setCases} resetAllFields={resetAllFields} setView={setView} />
      )}
      {view === 'dashboard' && (
        <DashboardView API_BASE={API_BASE} setView={setView} />
      )}
      {view === 'pdca' && (
        <PDCAView API_BASE={API_BASE} setView={setView} />
      )}
      {view === 'history' && (
        <HistoryView
          historySessions={historySessions} setHistorySessions={setHistorySessions}
          cases={cases} setCaseResults={setCaseResults} setBugs={setBugs}
          setCurrentCaseIndex={setCurrentCaseIndex}
          setVehicleModel={setVehicleModel} setModelYear={setModelYear}
          setVin={setVin} setArchitecture={setArchitecture}
          setIviModule={setIviModule} setCommModule={setCommModule}
          setAddress={setAddress} setPackagePhoto={setPackagePhoto}
          setEnvPhoto={setEnvPhoto} setTester={setTester} setMileage={setMileage} setCurrentSessionId={setCurrentSessionId}
          setEditingSession={setEditingSession}
          resetAllFields={resetAllFields} setView={setView}
          createEmptyResult={createEmptyResult}
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
                setToast({ message: 'Session metadata updated!', type: 'success' });
                setEditingSession(null);
                document.getElementById('searchHistoryBtn')?.click();
              })
              .catch(err => setToast({ message: 'Update failed: ' + err.message, type: 'error' }))
              .finally(() => setIsSaving(false));
          }}
        />
      )}

      <input type="file" ref={photoInputRef} className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
      <Toast toast={toast} />
    </>
  );
}
