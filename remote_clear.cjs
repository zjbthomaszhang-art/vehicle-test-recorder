require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
  try {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'test_recorder'
    });
    console.log('Connected to DB, clearing tables...');
    await db.query('SET FOREIGN_KEY_CHECKS=0;');
    await db.query('TRUNCATE TABLE test_results;');
    await db.query('TRUNCATE TABLE bugs;');
    await db.query('TRUNCATE TABLE session_cases;');
    await db.query('TRUNCATE TABLE test_sessions;');
    await db.query('SET FOREIGN_KEY_CHECKS=1;');
    console.log('Database cleared successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
})();
