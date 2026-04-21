const { pool } = require('./server/db.cjs');

async function migrate() {
    const connection = await pool.promise().getConnection();
    try {
        console.log("Checking columns...");
        
        try {
            await connection.query("ALTER TABLE test_sessions ADD COLUMN production_stage VARCHAR(100) DEFAULT ''");
            console.log("Added production_stage column");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("production_stage already exists");
            else console.log("Error adding production_stage:", e.message);
        }

        try {
            await connection.query("ALTER TABLE test_sessions ADD COLUMN test_env VARCHAR(100) DEFAULT ''");
            console.log("Added test_env column");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("test_env already exists");
            else console.log("Error adding test_env:", e.message);
        }

        console.log("Migration finished.");
    } catch (e) {
        console.error("Fatal:", e);
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrate();
