import { INITIAL_CASES } from './constants.js';

if (import.meta.env.VITE_APP_MODE === 'demo') {
  console.log('--- DEMO MODE ACTIVATED: Intercepting API calls ---');

  const lsKey = (key) => `vtr_demo_${key}`;

  // Initialize DB in localStorage if not exists
  if (!localStorage.getItem(lsKey('cases'))) {
    localStorage.setItem(lsKey('cases'), JSON.stringify(INITIAL_CASES));
  }
  if (!localStorage.getItem(lsKey('sessions'))) {
    localStorage.setItem(lsKey('sessions'), JSON.stringify([]));
  }
  if (!localStorage.getItem(lsKey('bugs'))) {
    localStorage.setItem(lsKey('bugs'), JSON.stringify([]));
  }

  const getDB = (key) => JSON.parse(localStorage.getItem(lsKey(key)) || '[]');
  const setDB = (key, data) => localStorage.setItem(lsKey(key), JSON.stringify(data));

  const originalFetch = window.fetch;

  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    
    // Only intercept our API calls
    if (!url.includes('/api/')) {
      return originalFetch(input, init);
    }

    const method = (init && init.method) || 'GET';
    const bodyStr = (init && init.body) || null;
    let body = null;
    if (bodyStr) {
      try { body = JSON.parse(bodyStr); } catch (e) { }
    }

    const createResponse = (data, status = 200) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(new Response(JSON.stringify(data), {
            status,
            headers: { 'Content-Type': 'application/json' }
          }));
        }, 300); // Simulate network latency
      });
    };

    try {
      // --- CASES ---
      if (url.endsWith('/api/cases')) {
        if (method === 'GET') {
          return createResponse(getDB('cases'));
        }
        if (method === 'POST') {
          const cases = getDB('cases');
          const maxId = cases.reduce((max, c) => Math.max(max, Number(c.id)), 0);
          const newCase = { ...body, id: body.id || (maxId + 1) };
          cases.push(newCase);
          setDB('cases', cases);
          return createResponse({ message: 'Created', id: newCase.id });
        }
      }
      
      if (url.includes('/api/cases/bulk') && method === 'POST') {
         const cases = getDB('cases');
         const newCases = Array.isArray(body) ? body : [];
         // Simple merge/replace
         const finalCases = [...cases];
         newCases.forEach(nc => {
             const idx = finalCases.findIndex(c => c.id == nc.id);
             if (idx >= 0) finalCases[idx] = nc;
             else finalCases.push(nc);
         });
         setDB('cases', finalCases);
         return createResponse({ count: newCases.length });
      }

      if (url.match(/\/api\/cases\/\d+$/)) {
        const id = url.split('/').pop();
        const cases = getDB('cases');
        if (method === 'DELETE') {
          setDB('cases', cases.filter(c => String(c.id) !== id));
          return createResponse({ message: 'Deleted' });
        }
        if (method === 'PUT') {
           const idx = cases.findIndex(c => String(c.id) === id);
           if (idx >= 0) {
               cases[idx] = { ...cases[idx], ...body };
               setDB('cases', cases);
               return createResponse({ message: 'Updated' });
           }
           return createResponse({ error: 'Not found' }, 404);
        }
      }

      // --- SESSIONS ---
      if (url.endsWith('/api/test-sessions')) {
        if (method === 'GET') {
          // Simple query emulation
          const urlObj = new URL(url, window.location.origin);
          const searchParams = urlObj.searchParams;
          let sessions = getDB('sessions');
          
          const modelMatch = searchParams.get('vehicleModel');
          if (modelMatch) sessions = sessions.filter(s => s.vehicle_model === modelMatch);
          
          // Return overview format like backend does
          const overview = sessions.map(s => {
             const passCount = s.results.filter(r => r.result === 'Pass').length;
             const failCount = s.results.filter(r => r.result === 'Fail').length;
             const blockedCount = s.results.filter(r => r.result === 'Blocked').length;
             return {
                 id: s.id,
                 timestamp: s.timestamp,
                 vehicle_model: s.vehicle.vehicleModel || s.vehicle.vehicle_model,
                 model_year: s.vehicle.model_year || s.vehicle.modelYear,
                 vin: s.vehicle.vin,
                 address: s.vehicle.address,
                 architecture: s.vehicle.architecture,
                 env_photos: JSON.stringify(s.vehicle.envPhotos || []),
                 case_count: s.results.length,
                 total_count: s.results.length, // approximation
                 pass_count: passCount,
                 fail_count: failCount,
                 blocked_count: blockedCount,
                 pass_fail_count: passCount + failCount
             };
          });
          return createResponse(overview);
        }
        if (method === 'POST') {
          const sessions = getDB('sessions');
          const maxId = sessions.reduce((max, s) => Math.max(max, Number(s.id)), 0);
          const newSession = { 
              ...body, 
              id: maxId + 1,
              timestamp: new Date().toISOString()
          };
          sessions.push(newSession);
          setDB('sessions', sessions);
          return createResponse({ message: 'Session created', sessionId: newSession.id });
        }
      }

      if (url.match(/\/api\/test-sessions\/\d+$/)) {
        const id = url.split('/').pop();
        const sessions = getDB('sessions');
        const sessionIdx = sessions.findIndex(s => String(s.id) === id);
        
        if (method === 'GET') {
           if (sessionIdx >= 0) return createResponse(sessions[sessionIdx]);
           return createResponse({ error: 'Session not found' }, 404);
        }
        
        if (method === 'PUT') {
           if (sessionIdx >= 0) {
              if (body.vehicle) sessions[sessionIdx].vehicle = body.vehicle;
              if (body.results) sessions[sessionIdx].results = body.results;
              setDB('sessions', sessions);
              return createResponse({ message: 'Session updated' });
           }
           return createResponse({ error: 'Session not found' }, 404);
        }
      }

      // --- BUGS ---
      if (url.endsWith('/api/bugs') && method === 'POST') {
         const bugs = getDB('bugs');
         const maxId = bugs.reduce((max, b) => Math.max(max, Number(b.id)), 0);
         const newBug = { ...body, id: maxId + 1 };
         bugs.push(newBug);
         setDB('bugs', bugs);
         return createResponse({ message: 'Bug created', id: newBug.id });
      }

      // Default fallback if we didn't mock the specific endpoint
      console.warn(`[Demo Mock] Unhandled API call: ${method} ${url}`);
      return createResponse({ error: 'Not implemented in Demo mode' }, 404);

    } catch (err) {
      console.error('[Demo Mock Error]', err);
      return createResponse({ error: 'Internal Mock Error' }, 500);
    }
  };
}
