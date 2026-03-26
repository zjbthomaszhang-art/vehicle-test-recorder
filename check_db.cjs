require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'test_recorder',
    port: 3306
});

const db = pool.promise();

async function checkCases() {
    try {
        const [rows] = await db.query("SELECT COUNT(*) as count FROM cases");
        console.log('Total cases:', rows[0].count);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkCases();
