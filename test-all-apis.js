fetch('http://127.0.0.1:3001/api/bugs').then(r => r.json()).then(console.log).catch(console.error);
fetch('http://127.0.0.1:3001/api/cases').then(r => r.json()).then(console.log).catch(console.error);
fetch('http://127.0.0.1:3001/api/test-sessions').then(r => r.json()).then(console.log).catch(console.error);
fetch('http://127.0.0.1:3001/api/cases/top-fails').then(r => r.json()).then(console.log).catch(console.error);
