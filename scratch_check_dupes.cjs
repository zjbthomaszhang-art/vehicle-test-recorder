require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: 3306,
  });
  const [orders] = await db.query("SELECT * FROM tester_case_orders WHERE tester_name = '施雯'");
  const caseIds = JSON.parse(orders[0].case_ids);
  console.log('Total caseIds:', caseIds.length);
  const uniqueCaseIds = new Set(caseIds);
  console.log('Unique caseIds:', uniqueCaseIds.size);
  
  if (caseIds.length !== uniqueCaseIds.size) {
    // find duplicates
    const seen = new Set();
    const dupes = [];
    for (const id of caseIds) {
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    console.log('Duplicates:', dupes);
    
    // Remove duplicates while keeping the first occurrence
    const fixedIds = Array.from(uniqueCaseIds);
    await db.query("UPDATE tester_case_orders SET case_ids = ? WHERE tester_name = '施雯'", [JSON.stringify(fixedIds)]);
    console.log('Fixed duplicates in database. New length:', fixedIds.length);
  }
  
  await db.end();
}
run().catch(console.error);
