const express = require('express');
const { pool, db } = require('../db.cjs');
const { getBeijingTime } = require('../utils.cjs');

const router = express.Router();

// Save a test session (POST)
router.post('/', async (req, res) => {
    const { vehicle, results } = req.body;
    const connection = await pool.promise().getConnection();

    try {
        await connection.beginTransaction();

        const sessionQuery = `
            INSERT INTO test_sessions (vehicle_model, model_year, vin, address, architecture, ivi_module, comm_module, package_photo, env_photo, tester, mileage, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [sessionResult] = await connection.query(sessionQuery, [
            vehicle.vehicleModel,
            vehicle.model_year,
            vehicle.vin,
            vehicle.address || '',
            vehicle.architecture,
            vehicle.iviModule,
            vehicle.commModule,
            vehicle.packagePhoto || null,
            vehicle.envPhoto || null,
            vehicle.tester || '',
            vehicle.mileage || '',
            getBeijingTime()
        ]);

        const sessionId = sessionResult.insertId;

        if (results && results.length > 0) {
            const resultQuery = `
                INSERT INTO test_results (session_id, case_id, start_time, car_exec_time, app_feedback_time, result, notes)
                VALUES ?
            `;
            const resultValues = results.map(r => [
                sessionId,
                r.case_id,
                r.start_time ? getBeijingTime(r.start_time) : null,
                r.car_exec_time ? getBeijingTime(r.car_exec_time) : null,
                r.app_feedback_time ? getBeijingTime(r.app_feedback_time) : null,
                r.result,
                r.notes
            ]);
            await connection.query(resultQuery, [resultValues]);
        }

        await connection.commit();
        res.json({ message: 'Session recorded successfully', sessionId });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Fetch all test sessions with optional filters
router.get('/', async (req, res) => {
    const { startDate, endDate, vehicleModel, architecture } = req.query;

    let query = `
        SELECT 
            ts.id, ts.vehicle_model, ts.model_year, ts.vin, ts.address, ts.architecture, 
            ts.ivi_module, ts.comm_module, ts.tester, ts.mileage, ts.timestamp,
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

    if (startDate) {
        query += ` AND ts.timestamp >= ?`;
        params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
        query += ` AND ts.timestamp <= ?`;
        params.push(`${endDate} 23:59:59`);
    }
    if (vehicleModel) {
        query += ` AND ts.vehicle_model LIKE ?`;
        params.push(`%${vehicleModel}%`);
    }
    if (architecture) {
        query += ` AND ts.architecture = ?`;
        params.push(architecture);
    }

    query += ` GROUP BY ts.id ORDER BY ts.id DESC`;

    try {
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch a specific test session with its results and bugs
router.get('/:id', async (req, res) => {
    const sessionId = req.params.id;

    try {
        const [sessions] = await db.query("SELECT * FROM test_sessions WHERE id = ?", [sessionId]);
        if (sessions.length === 0) return res.status(404).json({ error: "Session not found" });
        const session = sessions[0];

        const [results] = await db.query("SELECT * FROM test_results WHERE session_id = ? ORDER BY id DESC", [sessionId]);
        const [bugs] = await db.query("SELECT * FROM bugs WHERE session_id = ?", [sessionId]);

        res.json({ vehicle: session, results, bugs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an existing test session
router.put('/:id', async (req, res) => {
    const sessionId = req.params.id;
    const { vehicle, results } = req.body;
    const connection = await pool.promise().getConnection();

    try {
        await connection.beginTransaction();

        const updateSessionQuery = `
            UPDATE test_sessions SET 
                vehicle_model = ?, model_year = ?, vin = ?, address = ?, architecture = ?, ivi_module = ?, comm_module = ?, package_photo = ?, env_photo = ?, tester = ?, mileage = ?, timestamp = ?
            WHERE id = ?
        `;

        await connection.query(updateSessionQuery, [
            vehicle.vehicleModel, vehicle.model_year, vehicle.vin, vehicle.address || '', vehicle.architecture,
            vehicle.iviModule, vehicle.commModule, vehicle.packagePhoto || null, vehicle.envPhoto || null,
            vehicle.tester || '', vehicle.mileage || '', getBeijingTime(), sessionId
        ]);

        if (results && Array.isArray(results) && results.length > 0) {
            await connection.query("DELETE FROM test_results WHERE session_id = ?", [sessionId]);

            const resultQuery = `
                INSERT INTO test_results (session_id, case_id, start_time, car_exec_time, app_feedback_time, result, notes)
                VALUES ?
            `;
            const resultValues = results.map(r => [
                sessionId,
                r.case_id,
                r.start_time ? getBeijingTime(r.start_time) : null,
                r.car_exec_time ? getBeijingTime(r.car_exec_time) : null,
                r.app_feedback_time ? getBeijingTime(r.app_feedback_time) : null,
                r.result,
                r.notes
            ]);
            await connection.query(resultQuery, [resultValues]);
        }

        await connection.commit();
        res.json({ message: 'Session updated successfully' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
