const express = require('express');
const multer  = require('multer');
const XLSX    = require('xlsx');
const { db, pool } = require('../db.cjs');


const router = express.Router();

// Memory storage — we only need the buffer to parse Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const ok = /\.(xlsx|xls)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only .xlsx / .xls files are allowed'), ok);
  }
});

// ─── GET /api/vin-rules ────────────────────────────────────────────
// Returns all rules (zh-CN merged rows) for client-side matching.
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, program_cd,
             position_1, position_2, position_3, position_4, position_5,
             position_6, position_7, position_8, position_9, position_10, position_11,
             veh_manuf_year, veh_model_desc, message_desc_zh, message_desc_en
      FROM vin_rules
      ORDER BY id
    `);
    res.json(rows);
  } catch (err) {
    console.error('[vin-rules] GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/vin-rules/status ─────────────────────────────────────
router.get('/status', async (req, res) => {
  try {
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) AS cnt FROM vin_rules');
    const [[latest]]  = await db.query(
      'SELECT uploaded_at FROM vin_rules ORDER BY uploaded_at DESC LIMIT 1'
    );
    res.json({ count: cnt, uploaded_at: latest ? latest.uploaded_at : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/vin-rules/upload ────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const wb   = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { defval: null });

    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Excel sheet is empty' });
    }

    // Group rows by unique key (same rule, different LOCALE_CD)
    // Key = PROGRAM_CD + positions 1-11
    const ruleMap = new Map();

    for (const row of data) {
      const key = [
        row['PROGRAM_CD'],
        row['POSITION_1_VALUE'],  row['POSITION_2_VALUE'],
        row['POSITION_3_VALUE'],  row['POSITION_4_VALUE'],
        row['POSITION_5_VALUE'],  row['POSITION_6_VALUE'],
        row['POSITION_7_VALUE'],  row['POSITION_8_VALUE'],
        row['POSITION_9_VALUE'],  row['POSITION_10_VALUE'],
        row['POSITION_11_VALUE'], row['VEH_MANUF_YEAR'],
      ].join('|');

      if (!ruleMap.has(key)) {
        ruleMap.set(key, {
          program_cd:      row['PROGRAM_CD']        || null,
          position_1:      row['POSITION_1_VALUE']  || null,
          position_2:      row['POSITION_2_VALUE']  || null,
          position_3:      row['POSITION_3_VALUE']  || null,
          position_4:      row['POSITION_4_VALUE']  || null,
          position_5:      row['POSITION_5_VALUE']  || null,
          position_6:      row['POSITION_6_VALUE']  || null,
          position_7:      row['POSITION_7_VALUE']  || null,
          position_8:      row['POSITION_8_VALUE']  || null,
          position_9:      row['POSITION_9_VALUE']  || null,
          position_10:     row['POSITION_10_VALUE'] || null,
          position_11:     row['POSITION_11_VALUE'] || null,
          veh_manuf_year:  row['VEH_MANUF_YEAR']    || null,
          veh_model_desc:  row['VEH_MODEL_DESC']    || null,
          message_desc_zh: null,
          message_desc_en: null,
        });
      }

      const entry = ruleMap.get(key);
      const locale = (row['LOCALE_CD'] || '').trim().toLowerCase();
      if (locale === 'zh-cn') entry.message_desc_zh = row['MESSAGE_DESC'] || null;
      if (locale === 'en-us') entry.message_desc_en = row['MESSAGE_DESC'] || null;
    }

    const rules = Array.from(ruleMap.values());

    // Replace all existing rules atomically using a transaction
    const conn = await pool.promise().getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM vin_rules');

      if (rules.length > 0) {
        // Insert in chunks of 500 to avoid hitting max_allowed_packet
        const chunkSize = 500;
        for (let i = 0; i < rules.length; i += chunkSize) {
          const chunk = rules.slice(i, i + chunkSize);
          const placeholders = chunk.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
          const values = chunk.flatMap(r => [
            r.program_cd, r.position_1, r.position_2, r.position_3, r.position_4,
            r.position_5, r.position_6, r.position_7, r.position_8, r.position_9,
            r.position_10, r.position_11, r.veh_manuf_year, r.veh_model_desc,
            r.message_desc_zh, r.message_desc_en,
          ]);
          await conn.query(
            `INSERT INTO vin_rules
             (program_cd, position_1, position_2, position_3, position_4,
              position_5, position_6, position_7, position_8, position_9,
              position_10, position_11, veh_manuf_year, veh_model_desc,
              message_desc_zh, message_desc_en)
             VALUES ${placeholders}`,
            values
          );
        }
      }

      await conn.commit();
      res.json({ success: true, count: rules.length });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('[vin-rules] upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
