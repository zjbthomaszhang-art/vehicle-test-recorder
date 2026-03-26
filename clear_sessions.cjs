const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Connection error:', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    db.run("DELETE FROM test_results", function(err) {
        if (err) console.error('Error clearing test_results:', err.message);
        else console.log(`Deleted ${this.changes} rows from test_results.`);
    });

    db.run("DELETE FROM test_sessions", function(err) {
        if (err) console.error('Error clearing test_sessions:', err.message);
        else console.log(`Deleted ${this.changes} rows from test_sessions.`);
    });

    db.run("DELETE FROM bugs", function(err) {
        if (err) console.error('Error clearing bugs:', err.message);
        else console.log(`Deleted ${this.changes} rows from bugs.`);
    });

    db.run("VACUUM", (err) => {
        db.close(() => {
            console.log("Finished clearing session data.");
        });
    });
});
