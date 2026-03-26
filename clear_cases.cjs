const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/database.sqlite');
db.run('DELETE FROM cases', function(err) {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('All cases deleted. Rows affected:', this.changes);
  }
  db.close();
});
