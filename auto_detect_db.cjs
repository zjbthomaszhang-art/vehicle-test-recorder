const mysql = require('mysql2/promise');

async function testPasswords() {
    const passwords = ['root', '123456', '', 'password', 'mysql'];
    
    for (const pwd of passwords) {
        try {
            const connection = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: pwd,
                database: 'test_recorder',
                port: 3306
            });
            console.log(`[SUCCESS] Connected to local MySQL successfully with password: "${pwd}"`);
            await connection.end();
            return;
        } catch (err) {
            console.log(`[FAILED] Password "${pwd}" failed (or DB not found): ` + err.message);
        }
    }
    console.log("Could not find working root password. Is MySQL running?");
}

testPasswords();
