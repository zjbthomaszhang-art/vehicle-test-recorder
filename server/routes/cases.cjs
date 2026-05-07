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
    const { id, category, functionCategory, function: func, content, type, expected, is_active } = req.body;
    if (!category || !func) return res.status(400).json({ error: 'Category and Function are required' });

    const query = `
        INSERT INTO cases (id, category, function_category, \`function\`, content, type, expected, is_active, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          category=VALUES(category),
          function_category=VALUES(function_category),
          \`function\`=VALUES(\`function\`),
          content=VALUES(content),
          type=VALUES(type),
          expected=VALUES(expected),
          is_active=VALUES(is_active),
          updated_at=VALUES(updated_at)
    `;

    try {
        let isActiveVal = 1;
        if (is_active !== undefined) {
            isActiveVal = is_active;
        } else {
            const [existing] = await db.query(
                "SELECT is_active FROM cases WHERE id = ? OR (category = ? AND function_category = ? AND `function` = ? AND content = ?) LIMIT 1",
                [id, category, functionCategory || '', func, content]
            );
            if (existing && existing.length > 0) {
                isActiveVal = existing[0].is_active;
            }
        }

        const [result] = await db.query(query, [id, category, functionCategory || '', func, content, type, expected, isActiveVal, getBeijingTime()]);
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
        INSERT INTO cases (id, category, function_category, \`function\`, content, type, expected, is_active, updated_at)
        VALUES ?
        ON DUPLICATE KEY UPDATE
          category=VALUES(category),
          function_category=VALUES(function_category),
          \`function\`=VALUES(\`function\`),
          content=VALUES(content),
          type=VALUES(type),
          expected=VALUES(expected),
          is_active=VALUES(is_active),
          updated_at=VALUES(updated_at)
    `;

    try {
        const [existingCases] = await db.query("SELECT id, category, function_category, `function`, content, is_active FROM cases");
        const mapById = new Map();
        const mapByText = new Map();

        existingCases.forEach(c => {
            mapById.set(String(c.id), c);
            const textKey = `${c.category}::${c.function_category}::${c.function}::${c.content}`;
            mapByText.set(textKey, c);
        });

        const values = cases.map(c => {
            const textKey = `${c.category}::${c.functionCategory || ''}::${c.function}::${c.content}`;
            const existingByText = mapByText.get(textKey);
            const existingById = mapById.get(String(c.id));

            let isActive = 1;
            if (c.is_active !== undefined) {
                isActive = c.is_active;
            } else if (existingByText) {
                isActive = existingByText.is_active;
            } else if (existingById) {
                isActive = existingById.is_active;
            }

            return [
                c.id, c.category, c.functionCategory || '', c.function, c.content, c.type, c.expected, isActive, getBeijingTime()
            ];
        });

        await db.query(query, [values]);
        res.json({ message: 'Bulk import successful', count: cases.length });
    } catch (err) {
        console.error("Bulk insert error:", err);
        res.status(500).json({ error: 'Error during bulk import' });
    }
});

// Toggle active status
router.patch('/:id/toggle-active', async (req, res) => {
    try {
        const { is_active } = req.body;
        const [result] = await db.query("UPDATE cases SET is_active = ?, updated_at = ? WHERE id = ?", [is_active ? 1 : 0, getBeijingTime(), req.params.id]);
        res.json({ message: 'Case active status updated successfully', changes: result.affectedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
