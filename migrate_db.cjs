const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');

    db.serialize(() => {
        console.log('Starting migration to reorder cases table columns...');
        db.run('BEGIN TRANSACTION');

        // 1. Create temporary new table with correct column order
        db.run(`CREATE TABLE cases_new (
            id TEXT PRIMARY KEY,
            category TEXT,
            function_category TEXT DEFAULT '',
            function TEXT,
            content TEXT,
            type TEXT,
            expected TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error("Error creating new table:", err.message);
        });

        // 2. Copy data from old table to new table
        db.run(`INSERT INTO cases_new (id, category, function_category, function, content, type, expected, updated_at)
                SELECT id, category, function_category, function, content, type, expected, updated_at
                FROM cases`, (err) => {
            if (err) console.error("Error copying data:", err.message);
        });

        // 3. Drop old table
        db.run(`DROP TABLE cases`, (err) => {
            if (err) console.error("Error dropping old table:", err.message);
        });

        // 4. Rename new table to original name
        db.run(`ALTER TABLE cases_new RENAME TO cases`, (err) => {
            if (err) console.error("Error renaming new table:", err.message);
        });

        db.run('COMMIT', (err) => {
            if (err) {
                console.error("Migration failed:", err.message);
                db.run('ROLLBACK');
            } else {
                console.log('Migration successful. Column "function_category" is now placed after "category".');
            }
            db.close();
        });
    });
});
