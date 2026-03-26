require('dotenv').config();
const mysql = require('mysql2');

console.log('Connecting to:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: 3306
});

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'test_recorder',
    port: 3306
});

const db = pool.promise();

async function test() {
    try {
        const [rows] = await db.query("SELECT 1");
        console.log('Connection successful!');
        process.exit(0);
    } catch (err) {
        console.error('Connection failed!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        process.exit(1);
    }
}

test();
