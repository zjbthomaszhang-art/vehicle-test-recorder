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
    // Clear the cases table
    db.run("DELETE FROM cases", function(err) {
        if (err) {
            console.error('Error clearing cases:', err.message);
        } else {
            console.log(`Successfully deleted ${this.changes} rows from cases table.`);
        }
        
        // Optional: Vacuum the database to reclaim space
        db.run("VACUUM", (err) => {
            if (err) console.error("Vacuum error:", err.message);
            db.close((err) => {
                if (err) console.error("Close error:", err.message);
                console.log("Database connection closed.");
            });
        });
    });
});
