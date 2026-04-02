const mysql = require('mysql2');

const pool = mysql.createPool({
    host: '47.103.7.184',
    user: 'root',
    password: 'Thom@s1983',
    database: 'test_recorder',
    port: 3306,
    connectTimeout: 5000 // 5 seconds
});

const db = pool.promise();

async function check() {
    try {
        console.log("正在尝试连接远程数据库...");
        const [rows] = await db.query("SHOW TABLES");
        console.log("连接成功！当前存在的表：");
        console.log(rows);
        process.exit(0);
    } catch (err) {
        console.error("连接失败！错误信息：", err.message);
        process.exit(1);
    }
}

check();
