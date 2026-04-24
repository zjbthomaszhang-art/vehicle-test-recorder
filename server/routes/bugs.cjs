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
        const [rows] = params.length > 0 ? await db.query(query, params) : await db.query(query);
        // Parse media JSON for each bug
        const result = rows.map(b => ({
            ...b,
            media: (() => {
                if (!b.media) return [];
                try { const m = JSON.parse(b.media); return Array.isArray(m) ? m : []; }
                catch { return []; }
            })()
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a bug
router.post('/', async (req, res) => {
    const { session_id, case_id, description, app_duration, media } = req.body;
    if (!session_id || !case_id) return res.status(400).json({ error: 'session_id and case_id are required' });

    // Serialize media array to JSON string for storage
    const mediaJson = media && Array.isArray(media) ? JSON.stringify(media) : null;

    const query = `
        INSERT INTO bugs (session_id, case_id, description, app_duration, timestamp, media)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
        const [result] = await db.query(query, [session_id, case_id, description || '', app_duration || '', getBeijingTime(), mediaJson]);
        res.json({ message: 'Bug created successfully', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a bug (PDCA workflow)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, assignee, root_cause, action_notes } = req.body;
    
    try {
        const updates = [];
        const params = [];
        
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }
        if (assignee !== undefined) { updates.push('assignee = ?'); params.push(assignee); }
        if (root_cause !== undefined) { updates.push('root_cause = ?'); params.push(root_cause); }
        if (action_notes !== undefined) { updates.push('action_notes = ?'); params.push(action_notes); }
        
        if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
        
        params.push(id);
        const query = `UPDATE bugs SET ${updates.join(', ')} WHERE id = ?`;
        
        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Bug not found' });
        }
        res.json({ message: 'Bug updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
