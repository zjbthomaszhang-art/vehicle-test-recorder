const express = require('express');
const { db } = require('../db.cjs');
const { getBeijingTime } = require('../utils.cjs');

const router = express.Router();

// Fetch bugs with optional filters
router.get('/', async (req, res) => {
    const { session_id, case_id } = req.query;
    let query = "SELECT * FROM bugs WHERE 1=1";
    const params = [];

    if (session_id) {
        query += " AND session_id = ?";
        params.push(session_id);
    }
    if (case_id) {
        query += " AND case_id = ?";
        params.push(case_id);
    }

    try {
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a bug
router.post('/', async (req, res) => {
    const { session_id, case_id, description, app_duration } = req.body;
    if (!session_id || !case_id) return res.status(400).json({ error: 'session_id and case_id are required' });

    const query = `
        INSERT INTO bugs (session_id, case_id, description, app_duration, timestamp)
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        const [result] = await db.query(query, [session_id, case_id, description || '', app_duration || '', getBeijingTime()]);
        res.json({ message: 'Bug created successfully', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
