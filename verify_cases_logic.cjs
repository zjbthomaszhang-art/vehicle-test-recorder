const { db } = require('./server/db.cjs');
const { assignHierarchicalNumbers } = require('./src/utils/caseNumbering.js');

async function verify() {
    try {
        console.log("1. Cleaning up database...");
        await db.query("DELETE FROM cases WHERE category LIKE 'TEST_VERIFY_%'");
        await db.query("DELETE FROM test_sessions WHERE vehicle_model = 'TEST_MOCK_MODEL'");

        console.log("2. Inserting initial cases...");
        const initialCases = [
            { id: 10001, category: 'TEST_VERIFY_A', function_category: 'FC1', function: 'F1', content: 'Content1', sort_order: 1 },
            { id: 10002, category: 'TEST_VERIFY_A', function_category: 'FC1', function: 'F1', content: 'Content2', sort_order: 2 },
            { id: 10003, category: 'TEST_VERIFY_A', function_category: 'FC2', function: 'F2', content: 'Content3', sort_order: 3 },
            { id: 10004, category: 'TEST_VERIFY_B', function_category: 'FC3', function: 'F3', content: 'Content4', sort_order: 4 },
        ];
        
        for (const c of initialCases) {
            await db.query(
                "INSERT INTO cases (id, category, function_category, `function`, content, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
                [c.id, c.category, c.function_category, c.function, c.content, c.sort_order]
            );
        }

        console.log("3. Creating a test session and recording test results...");
        const [sessionRes] = await db.query(
            "INSERT INTO test_sessions (vehicle_model, timestamp) VALUES ('TEST_MOCK_MODEL', ?)",
            [new Date().toISOString().slice(0, 19).replace('T', ' ')]
        );
        const sessionId = sessionRes.insertId;

        // Record results for case 10002 and 10004
        await db.query(
            "INSERT INTO test_results (session_id, case_id, result) VALUES (?, ?, ?), (?, ?, ?)",
            [sessionId, 10002, 'Pass', sessionId, 10004, 'Fail']
        );

        console.log("4. Simulating a bulk import that rearranges and adds cases...");
        // Suppose the new excel has:
        // 1. Content1 (was 10001)
        // 2. Content3 (was 10003)  <-- Order changed!
        // 3. Content2 (was 10002, inherited)
        // 4. NEW Content!
        // 5. Content4 (was 10004, inherited)
        // It's entirely new ordering.
        const newImport = [
            { category: 'TEST_VERIFY_A', functionCategory: 'FC1', function: 'F1', content: 'Content1' },
            { category: 'TEST_VERIFY_A', functionCategory: 'FC2', function: 'F2', content: 'Content3' },
            { category: 'TEST_VERIFY_A', functionCategory: 'FC1', function: 'F1', content: 'Content2' },
            { category: 'TEST_VERIFY_A', functionCategory: 'FC2', function: 'F2', content: 'Content_NEW' },
            { category: 'TEST_VERIFY_B', functionCategory: 'FC3', function: 'F3', content: 'Content4' }
        ];

        // This is exactly the logic in routes/cases.cjs
        const [existingCases] = await db.query("SELECT id, category, function_category, `function`, content, is_active FROM cases WHERE category LIKE 'TEST_VERIFY_%'");
        const mapByText = new Map();
        let maxId = 0;
        
        const [allCases] = await db.query("SELECT MAX(id) as maxId FROM cases");
        if (allCases[0].maxId) maxId = allCases[0].maxId;

        existingCases.forEach(c => {
            const textKey = `${c.category}::${c.function_category}::${c.function}::${c.content}`;
            mapByText.set(textKey, c);
        });

        const values = newImport.map((c, index) => {
            const textKey = `${c.category}::${c.functionCategory || ''}::${c.function}::${c.content}`;
            const existingByText = mapByText.get(textKey);

            let isActive = 1;
            let targetId;

            if (existingByText) {
                targetId = existingByText.id;
                isActive = existingByText.is_active;
            } else {
                maxId++;
                targetId = maxId;
            }

            return [
                targetId, c.category, c.functionCategory || '', c.function, c.content, 'Test', 'Expected', isActive, new Date().toISOString().slice(0, 19).replace('T', ' '), index + 1
            ];
        });

        const query = `
            INSERT INTO cases (id, category, function_category, \`function\`, content, type, expected, is_active, updated_at, sort_order)
            VALUES ?
            ON DUPLICATE KEY UPDATE
              category=VALUES(category),
              function_category=VALUES(function_category),
              \`function\`=VALUES(\`function\`),
              content=VALUES(content),
              type=VALUES(type),
              expected=VALUES(expected),
              is_active=VALUES(is_active),
              updated_at=VALUES(updated_at),
              sort_order=VALUES(sort_order)
        `;

        await db.query("UPDATE cases SET sort_order = 999999 WHERE category LIKE 'TEST_VERIFY_%'");
        await db.query(query, [values]);

        console.log("5. Fetching cases and test results to verify inheritance...");
        const [casesAfter] = await db.query("SELECT * FROM cases WHERE category LIKE 'TEST_VERIFY_%' ORDER BY sort_order ASC");
        
        // Output case info
        const casesWithHierarchy = assignHierarchicalNumbers(casesAfter);
        console.log("\n--- Cases After Import ---");
        casesWithHierarchy.forEach(c => {
            console.log(`[Order: ${c.sort_order}] [ID: ${c.id}] [Hierarchy: ${c.case_number}] ${c.category} -> ${c.function_category} -> ${c.function} -> ${c.content}`);
        });

        console.log("\n--- Test Results Linked to Cases ---");
        const [results] = await db.query("SELECT * FROM test_results WHERE session_id = ?", [sessionId]);
        results.forEach(r => {
            const c = casesWithHierarchy.find(c => c.id === r.case_id);
            if (c) {
                console.log(`Found result '${r.result}' for case ID ${r.case_id}. Mapped to content: '${c.content}', Hierarchy: ${c.case_number}`);
            } else {
                console.log(`ERROR: Result for case ID ${r.case_id} not found in cases list!`);
            }
        });

        const passId = casesWithHierarchy.find(c => c.content === 'Content2').id;
        const failId = casesWithHierarchy.find(c => c.content === 'Content4').id;
        if (results.find(r => r.case_id === passId && r.result === 'Pass') &&
            results.find(r => r.case_id === failId && r.result === 'Fail')) {
            console.log("\nVERIFICATION SUCCESSFUL: Test results correctly inherited the cases despite reordering and new insertions.");
        } else {
            console.log("\nVERIFICATION FAILED: Test results mismatched.");
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        await db.query("DELETE FROM cases WHERE category LIKE 'TEST_VERIFY_%'");
        await db.query("DELETE FROM test_sessions WHERE vehicle_model = 'TEST_MOCK_MODEL'");
        process.exit(0);
    }
}

verify();
