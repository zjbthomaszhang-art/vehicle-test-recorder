require('dotenv').config();
const { pool, db } = require('./server/db.cjs');

// Assign hierarchical case numbers (same as caseNumbering.js)
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
    const caseNumber = `T${catNode.number}-${fCatNode.number}-${funcNode.number}-${funcNode.counter}`;
    return { ...c, case_number: caseNumber };
  });
}

async function fixSessionCases() {
  const connection = await pool.promise().getConnection();
  try {
    console.log('=== START FIXING SESSION CASES ORDER ===');

    // 1. Fetch master cases sort_order
    const [masterCases] = await connection.query('SELECT id, sort_order FROM cases');
    const masterSortMap = new Map();
    masterCases.forEach(mc => masterSortMap.set(Number(mc.id), Number(mc.sort_order || 0)));

    // 2. Fetch all sessions
    const [sessions] = await connection.query('SELECT id, tester, vehicle_model, timestamp FROM test_sessions ORDER BY id DESC');
    console.log(`Found ${sessions.length} sessions.`);

    for (const sess of sessions) {
      const sessionId = sess.id;
      const testerName = (sess.tester || '').trim();

      // Check if tester has custom order
      let customOrder = null;
      if (testerName !== '') {
        const [orderRows] = await connection.query('SELECT case_ids FROM tester_case_orders WHERE tester_name = ?', [testerName]);
        if (orderRows.length > 0) {
          try {
            const parsed = JSON.parse(orderRows[0].case_ids);
            if (Array.isArray(parsed) && parsed.length > 0) customOrder = parsed;
          } catch(e) {}
        }
      }

      const [sessionCases] = await connection.query('SELECT * FROM session_cases WHERE session_id = ?', [sessionId]);
      if (!sessionCases || sessionCases.length === 0) continue;

      const getMasterSortOrder = (item) => {
        const origId = Number(item.original_case_id || item.id);
        if (masterSortMap.has(origId)) return masterSortMap.get(origId);
        return Number(item.sort_order || 0);
      };

      if (customOrder) {
        const orderMap = new Map();
        customOrder.forEach((id, idx) => orderMap.set(Number(id), idx));
        sessionCases.sort((a, b) => {
          const origIdA = Number(a.original_case_id || a.id);
          const origIdB = Number(b.original_case_id || b.id);
          const idxA = orderMap.has(origIdA) ? orderMap.get(origIdA) : 999999;
          const idxB = orderMap.has(origIdB) ? orderMap.get(origIdB) : 999999;
          if (idxA !== idxB) return idxA - idxB;
          const sortA = getMasterSortOrder(a);
          const sortB = getMasterSortOrder(b);
          if (sortA !== sortB) return sortA - sortB;
          return (origIdA - origIdB) || (a.id - b.id);
        });
      } else {
        sessionCases.sort((a, b) => {
          const sortA = getMasterSortOrder(a);
          const sortB = getMasterSortOrder(b);
          if (sortA !== sortB) return sortA - sortB;
          const origIdA = Number(a.original_case_id || a.id);
          const origIdB = Number(b.original_case_id || b.id);
          return (origIdA - origIdB) || (a.id - b.id);
        });
      }

      const numbered = assignHierarchicalNumbers(sessionCases);
      const ids = numbered.map(n => n.id);
      let sortCase = 'CASE id';
      let numCase = 'CASE id';
      const params = [];
      numbered.forEach((n, i) => {
        sortCase += ` WHEN ? THEN ?`;
        numCase += ` WHEN ? THEN ?`;
        params.push(n.id, i);
      });
      sortCase += ' END';
      numCase += ' END';
      const numParams = [];
      numbered.forEach(n => {
        numParams.push(n.id, n.case_number);
      });

      await connection.query(
        `UPDATE session_cases SET sort_order = ${sortCase}, case_number = ${numCase} WHERE id IN (?)`,
        [...params, ...numParams, ids]
      );

      // Print status for Session 30 or top 3 sessions
      if (sessionId === 30 || sessionId >= sessions[0].id - 2) {
        const c33 = numbered.find(c => c.original_case_id === 33);
        const c297 = numbered.find(c => c.original_case_id === 297);
        const idx33 = numbered.findIndex(c => c.original_case_id === 33);
        const idx297 = numbered.findIndex(c => c.original_case_id === 297);
        console.log(`Session ${sessionId} (${sess.tester}): Case 33 index = ${idx33} (case_number: ${c33?.case_number}), Case 297 index = ${idx297} (case_number: ${c297?.case_number})`);
      }
    }

    console.log('=== FIX COMPLETE ===');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing session cases:', err);
    process.exit(1);
  } finally {
    connection.release();
  }
}

fixSessionCases();
