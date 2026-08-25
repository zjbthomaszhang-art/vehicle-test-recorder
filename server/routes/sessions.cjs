const express = require('express');
const { pool, db } = require('../db.cjs');
const { getBeijingTime } = require('../utils.cjs');

const router = express.Router();

/**
 * POST /api/test-sessions
 * Create a new session + snapshot all active cases into session_cases
 */
router.post('/', async (req, res) => {
    const { vehicle, results } = req.body;
    const connection = await pool.promise().getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insert test_session
        const sessionQuery = `
            INSERT INTO test_sessions (vehicle_model, model_year, vin, production_stage, address, architecture, ivi_module, comm_module, test_env, env_photo, tester, mileage, remarks, ios_version, android_version, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [sessionResult] = await connection.query(sessionQuery, [
            vehicle.vehicleModel,
            vehicle.model_year,
            vehicle.vin,
            vehicle.production_stage || '',
            vehicle.address || '',
            vehicle.architecture,
            vehicle.iviModule,
            vehicle.commModule,
            vehicle.test_env || '',
            (Array.isArray(vehicle.envPhotos) && vehicle.envPhotos.length > 0)
                ? JSON.stringify(vehicle.envPhotos)
                : (vehicle.envPhoto || null),
            vehicle.tester || '',
            vehicle.mileage || '',
            vehicle.remarks || '',
            vehicle.iosVersion || '',
            vehicle.androidVersion || '',
            getBeijingTime()
        ]);
        const sessionId = sessionResult.insertId;

        // 2. Snapshot active cases into session_cases
        const [activeCases] = await connection.query(
            'SELECT * FROM cases WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );

        if (vehicle.tester && vehicle.tester.trim() !== '') {
            const [orderRows] = await connection.query(
                'SELECT case_ids FROM tester_case_orders WHERE tester_name = ?',
                [vehicle.tester.trim()]
            );
            if (orderRows.length > 0) {
                try {
                    const customOrder = JSON.parse(orderRows[0].case_ids);
                    if (Array.isArray(customOrder) && customOrder.length > 0) {
                        const orderMap = new Map();
                        customOrder.forEach((id, idx) => orderMap.set(Number(id), idx));
                        
                        activeCases.sort((a, b) => {
                            const idxA = orderMap.has(Number(a.id)) ? orderMap.get(Number(a.id)) : 999999;
                            const idxB = orderMap.has(Number(b.id)) ? orderMap.get(Number(b.id)) : 999999;
                            if (idxA !== idxB) return idxA - idxB;
                            return (a.sort_order - b.sort_order) || (a.id - b.id);
                        });
                        
                        activeCases.forEach((c, idx) => c.sort_order = idx);
                    }
                } catch(e) {
                    console.error("Error parsing custom case order", e);
                }
            }
        }

        let sessionCases = [];
        if (activeCases.length > 0) {
            // Build hierarchical case numbers (same logic as caseNumbering.js)
            const numbered = assignCaseNumbers(activeCases);

            const scValues = numbered.map(c => [
                sessionId,
                c.id,
                c.category || '',
                c.function_category || '',
                c.function || '',
                c.expected || '',
                c.type || 'simple',
                c.hint || '',
                c.case_number || '',
                c.sort_order || 0
            ]);

            const [scResult] = await connection.query(
                `INSERT INTO session_cases
                 (session_id, original_case_id, category, function_category, \`function\`, expected, type, hint, case_number, sort_order)
                 VALUES ?`,
                [scValues]
            );

            // Fetch back inserted session_cases with their new IDs
            const [inserted] = await connection.query(
                'SELECT * FROM session_cases WHERE session_id = ? ORDER BY sort_order ASC, id ASC',
                [sessionId]
            );
            sessionCases = inserted;
        }

        // 3. Insert test_results (using session_case_id)
        if (results && results.length > 0) {
            // Build a map: original_case_id → session_case_id
            const caseIdMap = {};
            sessionCases.forEach(sc => {
                if (sc.original_case_id) caseIdMap[sc.original_case_id] = sc.id;
            });

            const validResults = results.filter(r => r.result || (r.notes && r.notes.trim() !== ''));
            if (validResults.length > 0) {
                const resultValues = validResults.map(r => [
                    sessionId,
                    r.case_id || null,
                    r.session_case_id || caseIdMap[r.case_id] || null,
                    r.start_time ? getBeijingTime(r.start_time) : null,
                    r.car_exec_time ? getBeijingTime(r.car_exec_time) : null,
                    r.app_feedback_time ? getBeijingTime(r.app_feedback_time) : null,
                    r.result,
                    r.notes,
                    JSON.stringify(r.media || [])
                ]);
                await connection.query(
                    `INSERT INTO test_results (session_id, case_id, session_case_id, start_time, car_exec_time, app_feedback_time, result, notes, media) VALUES ?`,
                    [resultValues]
                );
            }
        }

        await connection.commit();
        res.json({ message: 'Session recorded successfully', sessionId, sessionCases });
    } catch (err) {
        await connection.rollback();
        console.error('[POST /sessions] Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/test-sessions
 * Fetch all test sessions with summary stats
 */
router.get('/', async (req, res) => {
    const { startDate, endDate, vehicleModel, architecture } = req.query;

    let query = `
        SELECT 
            ts.id, ts.vehicle_model, ts.model_year, ts.vin, ts.production_stage, ts.test_env, ts.address, ts.architecture, 
            ts.ivi_module, ts.comm_module, ts.env_photo, ts.tester, ts.mileage, ts.remarks, ts.timestamp,
            ts.ios_version, ts.android_version,
            COUNT(tr.id) as total_count,
            SUM(CASE WHEN tr.result IN ('Pass', 'Fail', 'N/A') THEN 1 ELSE 0 END) as case_count,
            SUM(CASE WHEN tr.result = 'Pass' THEN 1 ELSE 0 END) as pass_count,
            SUM(CASE WHEN tr.result = 'Fail' THEN 1 ELSE 0 END) as fail_count,
            SUM(CASE WHEN tr.result IN ('Pass', 'Fail') THEN 1 ELSE 0 END) as pass_fail_count
        FROM test_sessions ts
        LEFT JOIN test_results tr ON ts.id = tr.session_id
        WHERE ts.is_deleted = 0
    `;
    const params = [];

    if (startDate) { query += ` AND ts.timestamp >= ?`; params.push(`${startDate} 00:00:00`); }
    if (endDate)   { query += ` AND ts.timestamp <= ?`; params.push(`${endDate} 23:59:59`); }
    if (vehicleModel) { query += ` AND ts.vehicle_model LIKE ?`; params.push(`%${vehicleModel}%`); }
    if (architecture) { query += ` AND ts.architecture = ?`; params.push(architecture); }

    query += ` GROUP BY ts.id ORDER BY ts.id DESC`;

    try {
        const [rows] = params.length > 0 ? await db.query(query, params) : await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/test-sessions/:id
 * Fetch full session: vehicle info + session_cases snapshot + results + bugs
 */
router.get('/:id', async (req, res) => {
    const sessionId = req.params.id;
    try {
        const [sessions] = await db.query('SELECT * FROM test_sessions WHERE id = ? AND is_deleted = 0', [sessionId]);
        if (sessions.length === 0) return res.status(404).json({ error: 'Session not found' });
        const session = sessions[0];

        // Load session_cases snapshot (preferred)
        const [sessionCases] = await db.query(
            'SELECT * FROM session_cases WHERE session_id = ? ORDER BY sort_order ASC, id ASC',
            [sessionId]
        );

        // Load results — join with session_cases if available, fallback to cases
        let results;
        if (sessionCases.length > 0) {
            const [rows] = await db.query(
                `SELECT tr.*, 
                        sc.original_case_id,
                        sc.category, sc.function_category, sc.\`function\`, sc.expected, sc.type, sc.hint, sc.case_number
                 FROM test_results tr
                 LEFT JOIN session_cases sc ON tr.session_case_id = sc.id
                 WHERE tr.session_id = ?
                 ORDER BY tr.id`,
                [sessionId]
            );
            results = rows;
        } else {
            // Fallback: old sessions without snapshot — join cases directly
            const [rows] = await db.query(
                `SELECT tr.*, c.category, c.function_category, c.\`function\`, c.expected, c.type, c.hint
                 FROM test_results tr
                 LEFT JOIN cases c ON tr.case_id = c.id
                 WHERE tr.session_id = ?
                 ORDER BY tr.id`,
                [sessionId]
            );
            results = rows;
        }

        if (results && Array.isArray(results)) {
            results.forEach(r => {
                if (typeof r.media === 'string') {
                    try { r.media = JSON.parse(r.media); } catch(e) { r.media = []; }
                } else if (!r.media) {
                    r.media = [];
                }
            });
        }

        const [bugs] = await db.query(`
            SELECT b.*, 
                   COALESCE(sc.function_category, c.function_category, sc.category, c.category) as function_category,
                   COALESCE(sc.\`function\`, c.\`function\`) as \`function\`,
                   COALESCE(sc.expected, c.expected) as expected
            FROM bugs b
            LEFT JOIN session_cases sc ON b.session_case_id = sc.id
            LEFT JOIN cases c ON b.case_id = c.id
            WHERE b.session_id = ?
        `, [sessionId]);
        if (bugs && Array.isArray(bugs)) {
            bugs.forEach(b => {
                if (typeof b.media === 'string') {
                    try { b.media = JSON.parse(b.media); } catch(e) { b.media = []; }
                } else if (!b.media) {
                    b.media = [];
                }
                if (b.description && b.description.includes(' | ACTIVE_CASE: ')) {
                    b.description = b.description.split(' | ACTIVE_CASE: ')[0];
                }
            });
        }

        res.json({ vehicle: session, sessionCases, results, bugs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/test-sessions/:id
 * Update vehicle info and results for an existing session (keep snapshot intact)
 */
router.put('/:id', async (req, res) => {
    const sessionId = req.params.id;
    const { vehicle, results } = req.body;
    console.log(`[PUT /sessions/${sessionId}] Request body keys:`, Object.keys(req.body || {}));
    console.log(`[PUT /sessions/${sessionId}] Results array length:`, results ? results.length : 0);
    
    console.log(`[PUT /sessions/${sessionId}] Acquiring connection from pool...`);
    const connection = await pool.promise().getConnection();
    console.log(`[PUT /sessions/${sessionId}] Connection acquired.`);

    try {
        console.log(`[PUT /sessions/${sessionId}] Beginning transaction...`);
        await connection.beginTransaction();
        console.log(`[PUT /sessions/${sessionId}] Transaction started.`);

        console.log(`[PUT /sessions/${sessionId}] Updating test_sessions table...`);
        await connection.query(
            `UPDATE test_sessions SET 
                vehicle_model=?, model_year=?, vin=?, production_stage=?, test_env=?, address=?,
                architecture=?, ivi_module=?, comm_module=?, env_photo=?, tester=?, mileage=?, remarks=?,
                ios_version=?, android_version=?, timestamp=?
             WHERE id=?`,
            [
                vehicle.vehicleModel, vehicle.model_year, vehicle.vin,
                vehicle.productionStage || vehicle.production_stage || '',
                vehicle.testEnv || vehicle.test_env || '',
                vehicle.address || '', vehicle.architecture,
                vehicle.iviModule, vehicle.commModule,
                (Array.isArray(vehicle.envPhotos) && vehicle.envPhotos.length > 0)
                    ? JSON.stringify(vehicle.envPhotos)
                    : (vehicle.envPhoto || null),
                vehicle.tester || '', vehicle.mileage || '', vehicle.remarks || '',
                vehicle.iosVersion || vehicle.ios_version || '',
                vehicle.androidVersion || vehicle.android_version || '',
                getBeijingTime(), sessionId
            ]
        );
        console.log(`[PUT /sessions/${sessionId}] test_sessions table updated.`);

        // Re-sort session_cases according to tester's custom order (or default)
        const testerName = (vehicle.tester || '').trim();
        let customOrder = null;
        if (testerName !== '') {
            console.log(`[PUT /sessions/${sessionId}] Querying custom case order for tester: ${testerName}`);
            const [orderRows] = await connection.query('SELECT case_ids FROM tester_case_orders WHERE tester_name = ?', [testerName]);
            if (orderRows.length > 0) {
                try {
                    const parsed = JSON.parse(orderRows[0].case_ids);
                    if (Array.isArray(parsed) && parsed.length > 0) customOrder = parsed;
                    console.log(`[PUT /sessions/${sessionId}] Found custom case order of length:`, customOrder.length);
                } catch(e) {
                    console.error("Error parsing custom case order", e);
                }
            }
        }

        console.log(`[PUT /sessions/${sessionId}] Querying existing session cases...`);
        const [existingSessionCases] = await connection.query('SELECT * FROM session_cases WHERE session_id = ?', [sessionId]);
        console.log(`[PUT /sessions/${sessionId}] Found session cases count:`, existingSessionCases.length);
        
        if (existingSessionCases.length > 0) {
            console.log(`[PUT /sessions/${sessionId}] Sorting session cases...`);
            if (customOrder) {
                const orderMap = new Map();
                customOrder.forEach((id, idx) => orderMap.set(Number(id), idx));
                existingSessionCases.sort((a, b) => {
                    const idxA = orderMap.has(Number(a.original_case_id)) ? orderMap.get(Number(a.original_case_id)) : 999999;
                    const idxB = orderMap.has(Number(b.original_case_id)) ? orderMap.get(Number(b.original_case_id)) : 999999;
                    if (idxA !== idxB) return idxA - idxB;
                    return (a.original_case_id - b.original_case_id) || (a.id - b.id);
                });
            } else {
                existingSessionCases.sort((a, b) => (a.original_case_id - b.original_case_id) || (a.id - b.id));
            }

            console.log(`[PUT /sessions/${sessionId}] Assigning case numbers...`);
            const numbered = assignCaseNumbers(existingSessionCases);
            console.log(`[PUT /sessions/${sessionId}] Bulk updating session cases sort order...`);
            // Bulk update sort_order and case_number in a single query using CASE/WHEN
            if (numbered.length > 0) {
                const ids = numbered.map((n, i) => n.id);
                let sortCase = 'CASE id';
                let numCase = 'CASE id';
                const params = [];
                numbered.forEach((n, i) => {
                    sortCase += ` WHEN ? THEN ?`;
                    numCase += ` WHEN ? THEN ?`;
                    params.push(n.id, i);      // for sort_order
                });
                sortCase += ' END';
                numCase += ' END';
                const numParams = [];
                numbered.forEach((n, i) => {
                    numParams.push(n.id, n.case_number);
                });
                await connection.query(
                    `UPDATE session_cases SET sort_order = ${sortCase}, case_number = ${numCase} WHERE id IN (?)`,
                    [...params, ...numParams, ids]
                );
            }
            console.log(`[PUT /sessions/${sessionId}] Session cases update complete.`);
        }

        if (results && Array.isArray(results) && results.length > 0) {
            console.log(`[PUT /sessions/${sessionId}] Deleting old test results...`);
            await connection.query('DELETE FROM test_results WHERE session_id = ?', [sessionId]);
            console.log(`[PUT /sessions/${sessionId}] Old test results deleted.`);

            // Load session_cases to rebuild caseId map
            console.log(`[PUT /sessions/${sessionId}] Querying session cases again...`);
            const [sessionCases] = await connection.query(
                'SELECT id, original_case_id FROM session_cases WHERE session_id = ?',
                [sessionId]
            );
            const caseIdMap = {};
            sessionCases.forEach(sc => { if (sc.original_case_id) caseIdMap[sc.original_case_id] = sc.id; });
            const scIdSet = new Set(sessionCases.map(sc => sc.id));

            const validResults = results.filter(r => r.result || (r.notes && r.notes.trim() !== ''));
            console.log(`[PUT /sessions/${sessionId}] Filtered valid results to insert count:`, validResults.length);
            if (validResults.length > 0) {
                const resultValues = validResults.map(r => {
                    const scId = r.session_case_id && scIdSet.has(r.session_case_id)
                        ? r.session_case_id
                        : (caseIdMap[r.case_id] || null);
                    return [
                        sessionId,
                        r.case_id || null,
                        scId,
                        r.start_time ? getBeijingTime(r.start_time) : null,
                        r.car_exec_time ? getBeijingTime(r.car_exec_time) : null,
                        r.app_feedback_time ? getBeijingTime(r.app_feedback_time) : null,
                        r.result,
                        r.notes,
                        JSON.stringify(r.media || [])
                    ];
                });
                console.log(`[PUT /sessions/${sessionId}] Bulk inserting new test results...`);
                await connection.query(
                    `INSERT INTO test_results (session_id, case_id, session_case_id, start_time, car_exec_time, app_feedback_time, result, notes, media) VALUES ?`,
                    [resultValues]
                );
                console.log(`[PUT /sessions/${sessionId}] Bulk insert complete.`);
            }
        }

        console.log(`[PUT /sessions/${sessionId}] Committing transaction...`);
        await connection.commit();
        console.log(`[PUT /sessions/${sessionId}] Transaction committed successfully.`);
        res.json({ message: 'Session updated successfully' });
    } catch (err) {
        console.error(`[PUT /sessions/${sessionId}] Error occurred, rolling back:`, err);
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        console.log(`[PUT /sessions/${sessionId}] Releasing database connection...`);
        connection.release();
        console.log(`[PUT /sessions/${sessionId}] Connection released.`);
    }
});

/**
 * DELETE /api/test-sessions/:id
 */
router.delete('/:id', async (req, res) => {
    const { id: sessionId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Logical Delete: Mark the session as deleted
        await connection.query('UPDATE test_sessions SET is_deleted = 1 WHERE id = ?', [sessionId]);

        await connection.commit();
        res.json({ message: 'Session deleted successfully' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

/**
 * Assign hierarchical case numbers (mirrors src/utils/caseNumbering.js logic)
 * Groups by category > functionCategory > function, assigns T{cat}-{funcCat}-{func} style numbering
 */
function assignCaseNumbers(cases) {
    const catCounter = {};
    const fcCounter = {};
    const fnCounter = {};
    const catMap = {};
    const fcMap = {};
    const fnMap = {};

    return cases.map(c => {
        const cat = c.category || '';
        const fc = c.function_category || '';
        const fn = c.function || '';
        const catKey = cat;
        const fcKey = `${cat}||${fc}`;
        const fnKey = `${cat}||${fc}||${fn}`;

        if (!(catKey in catMap)) {
            const n = Object.keys(catMap).length + 1;
            catMap[catKey] = n;
            catCounter[catKey] = 0;
        }
        const catNum = catMap[catKey];

        if (!(fcKey in fcMap)) {
            fcCounter[catKey] = (fcCounter[catKey] || 0) + 1;
            fcMap[fcKey] = fcCounter[catKey];
            fnCounter[fcKey] = 0;
        }
        const fcNum = fcMap[fcKey];

        if (!(fnKey in fnMap)) {
            fnCounter[fcKey] = (fnCounter[fcKey] || 0) + 1;
            fnMap[fnKey] = fnCounter[fcKey];
            catCounter[fnKey] = 0;
        }
        const fnNum = fnMap[fnKey];

        catCounter[fnKey] = (catCounter[fnKey] || 0) + 1;
        const caseNum = catCounter[fnKey];

        const case_number = `T${catNum}-${fcNum}-${fnNum}-${caseNum}`;
        return { ...c, case_number };
    });
}

module.exports = router;
