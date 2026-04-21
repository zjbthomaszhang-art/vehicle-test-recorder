require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
});
const db = pool.promise();

async function run() {
  const [sessions] = await db.query(
    'SELECT id, model_year, vehicle_model, vin, tester, address, timestamp FROM test_sessions ORDER BY id DESC LIMIT 20'
  );
  const [results] = await db.query(
    'SELECT session_id, COUNT(*) as total, SUM(result="pass") as pass_count, SUM(result="fail") as fail_count FROM test_results GROUP BY session_id'
  );
  const [bugs] = await db.query(
    'SELECT session_id, COUNT(*) as bug_count FROM bugs GROUP BY session_id'
  );

  const resultMap = Object.fromEntries(results.map(r => [r.session_id, r]));
  const bugMap = Object.fromEntries(bugs.map(b => [b.session_id, b.bug_count]));

  console.log('\n===== 测试记录 (最近20条) =====\n');
  if (sessions.length === 0) {
    console.log('数据库中暂无测试记录。');
  }
  for (const s of sessions) {
    const r = resultMap[s.id] || {};
    console.log(`ID: ${s.id} | ${s.model_year || '-'} ${s.vehicle_model || '-'} | VIN: ${s.vin || '-'}`);
    console.log(`   测试人: ${s.tester || '-'} | 地点: ${s.address || '-'} | 时间: ${s.timestamp || '-'}`);
    console.log(`   结果: 通过 ${r.pass_count||0} / 失败 ${r.fail_count||0} / 合计 ${r.total||0} | 缺陷: ${bugMap[s.id]||0}`);
    console.log('');
  }
  process.exit(0);
}

run().catch(e => { console.error('连接失败:', e.message); process.exit(1); });
