const express = require('express');
const router = express.Router();
const { db } = require('../db.cjs');

// GET /api/case-orders — list all testers with custom orders
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT tester_name, case_ids, updated_at FROM tester_case_orders ORDER BY updated_at DESC'
    );
    res.json(rows.map(r => ({
      ...r,
      case_ids: (() => { try { return JSON.parse(r.case_ids); } catch { return []; } })()
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/case-orders/:tester — get order for a specific tester
router.get('/:tester', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT tester_name, case_ids, updated_at FROM tester_case_orders WHERE tester_name = ?',
      [req.params.tester]
    );
    if (rows.length === 0) return res.json({ tester_name: req.params.tester, case_ids: [] });
    const row = rows[0];
    let case_ids = [];
    try { case_ids = JSON.parse(row.case_ids); } catch {}
    res.json({ tester_name: row.tester_name, case_ids, updated_at: row.updated_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/case-orders/:tester — upsert order for a tester
router.put('/:tester', async (req, res) => {
  const { case_ids } = req.body;
  if (!Array.isArray(case_ids)) return res.status(400).json({ error: 'case_ids must be an array' });
  try {
    await db.query(
      `INSERT INTO tester_case_orders (tester_name, case_ids, updated_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE case_ids = VALUES(case_ids), updated_at = NOW()`,
      [req.params.tester, JSON.stringify(case_ids)]
    );
    res.json({ success: true, tester_name: req.params.tester, count: case_ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/case-orders/:tester — reset to default order
router.delete('/:tester', async (req, res) => {
  try {
    await db.query('DELETE FROM tester_case_orders WHERE tester_name = ?', [req.params.tester]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
