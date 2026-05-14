require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

function assignHierarchicalNumbers(cases) {
    if (!cases || cases.length === 0) return [];
    const tree = { counter: 0, children: {} };
    return cases.map(c => {
        const cat = c.category || '';
        const fCat = c.function_category || c.functionCategory || '';
        const func = c.function || '';
        if (!tree.children[cat]) {
            tree.counter++;
            tree.children[cat] = { number: tree.counter, counter: 0, children: {} };
        }
        const catNode = tree.children[cat];
        if (!catNode.children[fCat]) {
            catNode.counter++;
            catNode.children[fCat] = { number: catNode.counter, counter: 0, children: {} };
        }
        const fCatNode = catNode.children[fCat];
        if (!fCatNode.children[func]) {
            fCatNode.counter++;
            fCatNode.children[func] = { number: fCatNode.counter, counter: 0, children: {} };
        }
        const funcNode = fCatNode.children[func];
        funcNode.counter++;
        return {
            ...c,
            case_number: `${catNode.number}.${fCatNode.number}.${funcNode.number}.${funcNode.counter}`
        };
    });
}

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: 3306,
  });
  
  // Get all cases
  const [cases] = await db.query('SELECT * FROM cases');
  
  // Get tester order
  const [orders] = await db.query("SELECT * FROM tester_case_orders WHERE tester_name = '施雯'");
  let caseIds = [];
  if (orders.length > 0) {
    caseIds = JSON.parse(orders[0].case_ids);
  }
  
  // Reorder cases based on caseIds
  const orderedCases = [];
  for (const id of caseIds) {
    const c = cases.find(c => String(c.id) === String(id));
    if (c) orderedCases.push(c);
  }
  
  const finalCases = assignHierarchicalNumbers(orderedCases);
  
  // Adding BOM for Excel UTF-8 support
  let csv = '\uFEFF顺序号,树形编号,功能大类,功能,期望结果\n';
  finalCases.forEach((c, idx) => {
    // Escape quotes and wrap in quotes for CSV safety
    const safeStr = (str) => '"' + (str || '').replace(/"/g, '""') + '"';
    csv += `${idx + 1},${safeStr(c.case_number)},${safeStr(c.function_category)},${safeStr(c.function)},${safeStr(c.expected)}\n`;
  });
  
  fs.writeFileSync('C:\\\\Users\\\\HG\\\\.gemini\\\\antigravity\\\\scratch\\\\vehicle-test-recorder\\\\shiweng_cases_export.csv', csv);
  console.log('Exported to CSV artifact.');
  await db.end();
}
run().catch(console.error);
