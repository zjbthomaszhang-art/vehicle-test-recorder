const express = require('express');
const { db } = require('../db.cjs');
const { getBeijingTime } = require('../utils.cjs');

const router = express.Router();

// Fetch all cases
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM cases ORDER BY id ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add or Update a case
router.post('/', async (req, res) => {
    const { id, category, functionCategory, function: func, content, type, expected } = req.body;
    if (!category || !func) return res.status(400).json({ error: 'Category and Function are required' });

    const query = `
        INSERT INTO cases (id, category, function_category, \`function\`, content, type, expected, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          category=VALUES(category),
          function_category=VALUES(function_category),
          \`function\`=VALUES(\`function\`),
          content=VALUES(content),
          type=VALUES(type),
          expected=VALUES(expected),
          updated_at=VALUES(updated_at)
    `;

    try {
        const [result] = await db.query(query, [id, category, functionCategory || '', func, content, type, expected, getBeijingTime()]);
        res.json({ message: 'Case saved successfully', id: id || result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk Insert or Update Cases
router.post('/bulk', async (req, res) => {
    const cases = req.body;
    if (!Array.isArray(cases) || cases.length === 0) {
        return res.status(400).json({ error: 'Expected an array of cases' });
    }

    const query = `
        INSERT INTO cases (id, category, function_category, \`function\`, content, type, expected, updated_at)
        VALUES ?
        ON DUPLICATE KEY UPDATE
          category=VALUES(category),
          function_category=VALUES(function_category),
          \`function\`=VALUES(\`function\`),
          content=VALUES(content),
          type=VALUES(type),
          expected=VALUES(expected),
          updated_at=VALUES(updated_at)
    `;

    const values = cases.map(c => [
        c.id, c.category, c.functionCategory || '', c.function, c.content, c.type, c.expected, getBeijingTime()
    ]);

    try {
        await db.query(query, [values]);
        res.json({ message: 'Bulk import successful', count: cases.length });
    } catch (err) {
        console.error("Bulk insert error:", err);
        res.status(500).json({ error: 'Error during bulk import' });
    }
});

// Delete a case
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM cases WHERE id = ?", [req.params.id]);
        res.json({ message: 'Case deleted successfully', changes: result.affectedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch historical results for a specific case
router.get('/:id/history', async (req, res) => {
    const caseId = req.params.id;
    const query = `
        SELECT tr.*, ts.timestamp, ts.vehicle_model, ts.model_year
        FROM test_results tr
        JOIN test_sessions ts ON tr.session_id = ts.id
        WHERE tr.case_id = ?
        ORDER BY ts.timestamp DESC
        LIMIT 5
    `;
    try {
        const [rows] = await db.query(query, [caseId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch top failed cases from test_results
router.get('/top-fails', async (req, res) => {
    try {
        const query = `
            SELECT case_id, COUNT(*) as fail_count
            FROM test_results 
            WHERE result = 'Fail'
            GROUP BY case_id
            ORDER BY fail_count DESC
            LIMIT 5
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
