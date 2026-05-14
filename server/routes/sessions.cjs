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
            INSERT INTO test_sessions (vehicle_model, model_year, vin, production_stage, address, architecture, ivi_module, comm_module, test_env, env_photo, tester, mileage, remarks, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    r.notes
                ]);
                await connection.query(
                    `INSERT INTO test_results (session_id, case_id, session_case_id, start_time, car_exec_time, app_feedback_time, result, notes) VALUES ?`,
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
            COUNT(tr.id) as total_count,
            SUM(CASE WHEN tr.result IN ('Pass', 'Fail', 'N/A') THEN 1 ELSE 0 END) as case_count,
            SUM(CASE WHEN tr.result = 'Pass' THEN 1 ELSE 0 END) as pass_count,
            SUM(CASE WHEN tr.result = 'Fail' THEN 1 ELSE 0 END) as fail_count,
            SUM(CASE WHEN tr.result IN ('Pass', 'Fail') THEN 1 ELSE 0 END) as pass_fail_count
        FROM test_sessions ts
        LEFT JOIN test_results tr ON ts.id = tr.session_id
        WHERE 1=1
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
        const [sessions] = await db.query('SELECT * FROM test_sessions WHERE id = ?', [sessionId]);
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

        const [bugs] = await db.query('SELECT * FROM bugs WHERE session_id = ?', [sessionId]);

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
    const connection = await pool.promise().getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `UPDATE test_sessions SET 
                vehicle_model=?, model_year=?, vin=?, production_stage=?, test_env=?, address=?,
                architecture=?, ivi_module=?, comm_module=?, env_photo=?, tester=?, mileage=?, remarks=?, timestamp=?
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
                getBeijingTime(), sessionId
            ]
        );

        // Re-sort session_cases according to tester's custom order (or default)
        const testerName = (vehicle.tester || '').trim();
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

        const [existingSessionCases] = await connection.query('SELECT * FROM session_cases WHERE session_id = ?', [sessionId]);
        if (existingSessionCases.length > 0) {
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

            const numbered = assignCaseNumbers(existingSessionCases);
            // Bulk update sort_order and case_number
            for (let i = 0; i < numbered.length; i++) {
                await connection.query(
                    'UPDATE session_cases SET sort_order = ?, case_number = ? WHERE id = ?',
                    [i, numbered[i].case_number, numbered[i].id]
                );
            }
        }

        if (results && Array.isArray(results) && results.length > 0) {
            await connection.query('DELETE FROM test_results WHERE session_id = ?', [sessionId]);

            // Load session_cases to rebuild caseId map
            const [sessionCases] = await connection.query(
                'SELECT id, original_case_id FROM session_cases WHERE session_id = ?',
                [sessionId]
            );
            const caseIdMap = {};
            sessionCases.forEach(sc => { if (sc.original_case_id) caseIdMap[sc.original_case_id] = sc.id; });
            // Also support direct session_case_id → session_case_id mapping
            const scIdSet = new Set(sessionCases.map(sc => sc.id));

            const validResults = results.filter(r => r.result || (r.notes && r.notes.trim() !== ''));
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
                        r.notes
                    ];
                });
                await connection.query(
                    `INSERT INTO test_results (session_id, case_id, session_case_id, start_time, car_exec_time, app_feedback_time, result, notes) VALUES ?`,
                    [resultValues]
                );
            }
        }

        await connection.commit();
        res.json({ message: 'Session updated successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('[PUT /sessions] Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

/**
 * DELETE /api/test-sessions/:id
 */
router.delete('/:id', async (req, res) => {
    const sessionId = req.params.id;
    const connection = await pool.promise().getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM test_results WHERE session_id = ?', [sessionId]);
        await connection.query('DELETE FROM session_cases WHERE session_id = ?', [sessionId]);
        await connection.query('DELETE FROM test_sessions WHERE id = ?', [sessionId]);
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
