fetch('http://127.0.0.1:3001/api/bugs')
  .then(r => r.json())
  .then(r => console.log("bugs:", r))
  .catch(console.error);
