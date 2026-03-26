const express = require('express');
const { db } = require('../db.cjs');

const router = express.Router();

// List all tables
router.get('/tables', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT TABLE_NAME as name FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() ORDER BY name");
        res.json(rows.map(r => r.name));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get table schema + row count
router.get('/table/:name', async (req, res) => {
    const table = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
    try {
        const [cols] = await db.query(`
            SELECT COLUMN_NAME as name, COLUMN_TYPE as type, IS_NULLABLE as notnull, COLUMN_KEY as pk, COLUMN_DEFAULT as \`default\`, ORDINAL_POSITION as cid
            FROM information_schema.columns 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
            ORDER BY cid
        `, [table]);

        const [rowCountRows] = await db.query(`SELECT COUNT(*) as count FROM ??`, [table]);
        res.json({
            columns: cols.map(c => ({
                ...c,
                notnull: c.notnull === 'NO' ? 1 : 0,
                pk: c.pk === 'PRI' ? 1 : 0
            })),
            rowCount: rowCountRows[0] ? rowCountRows[0].count : 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get table rows (paginated)
router.get('/table/:name/rows', async (req, res) => {
    const table = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const [cols] = await db.query(`
            SELECT COLUMN_NAME as name 
            FROM information_schema.columns 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'id'
        `, [table]);

        const hasId = cols.length > 0;
        const orderBy = hasId ? 'ORDER BY id DESC' : '';

        const [rows] = await db.query(`SELECT * FROM ?? ${orderBy} LIMIT ? OFFSET ?`, [table, limit, offset]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Run custom SQL query
router.post('/query', async (req, res) => {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'SQL is required' });
    const trimmed = sql.trim().toUpperCase();

    try {
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('SHOW') || trimmed.startsWith('DESCRIBE') || trimmed.startsWith('WITH') || trimmed.startsWith('EXPLAIN')) {
            const [rows] = await db.query(sql);
            res.json({ type: 'select', rows: Array.isArray(rows) ? rows : [rows] });
        } else {
            const [result] = await db.query(sql);
            res.json({ type: 'exec', changes: result.affectedRows, lastID: result.insertId });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DB Viewer HTML page
router.get('/viewer', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MySQL 5.7 数据库浏览器 · VehicleLab</title>
<style>
  :root {
    --bg: #0d1117; --bg2: #161b22; --bg3: #1f2733; --bg4: #2d3748;
    --border: #30363d; --blue: #58a6ff; --green: #3fb950; --red: #f85149;
    --yellow: #d29922; --text: #e6edf3; --muted: #8b949e; --font: 'Segoe UI', system-ui, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: var(--font); display: flex; height: 100vh; overflow: hidden; }
  #sidebar { width: 220px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
  #sidebar-header { padding: 16px; border-bottom: 1px solid var(--border); }
  #sidebar-header h1 { font-size: 14px; font-weight: 700; color: var(--blue); letter-spacing: 0.5px; }
  #sidebar-header p { font-size: 11px; color: var(--muted); margin-top: 2px; }
  #table-list { flex: 1; overflow-y: auto; padding: 8px; }
  .table-item { padding: 8px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; transition: background 0.15s; color: var(--muted); }
  .table-item:hover { background: var(--bg3); color: var(--text); }
  .table-item.active { background: var(--bg4); color: var(--blue); }
  .table-item .icon { font-size: 14px; }
  #main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  #topbar { padding: 12px 20px; border-bottom: 1px solid var(--border); background: var(--bg2); display: flex; align-items: center; gap: 12px; }
  #topbar h2 { font-size: 14px; font-weight: 600; flex: 1; }
  .badge { background: var(--bg4); color: var(--muted); font-size: 11px; padding: 2px 8px; border-radius: 12px; }
  #content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
  #tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--bg2); padding: 0 20px; }
  .tab { padding: 10px 16px; font-size: 13px; cursor: pointer; border-bottom: 2px solid transparent; color: var(--muted); transition: all 0.15s; }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--blue); border-bottom-color: var(--blue); }
  #panel { flex: 1; overflow: auto; padding: 16px 20px; }
  .data-table-wrap { overflow: auto; border: 1px solid var(--border); border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { background: var(--bg3); padding: 10px 12px; text-align: left; color: var(--muted); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); white-space: nowrap; position: sticky; top: 0; }
  tbody tr { border-bottom: 1px solid var(--border); transition: background 0.1s; }
  tbody tr:hover { background: var(--bg3); }
  tbody td { padding: 8px 12px; color: var(--text); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
  .null-val { color: var(--muted); font-style: italic; font-size: 12px; }
  #query-panel { display: flex; flex-direction: column; gap: 12px; height: 100%; }
  #sql-editor { width: 100%; height: 120px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'Consolas', monospace; font-size: 13px; padding: 12px; resize: vertical; outline: none; transition: border-color 0.15s; }
  #sql-editor:focus { border-color: var(--blue); }
  .btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.15s; }
  .btn-blue { background: var(--blue); color: #0d1117; }
  .btn-blue:hover { opacity: 0.85; }
  .btn-ghost { background: var(--bg3); color: var(--muted); border: 1px solid var(--border); }
  .btn-ghost:hover { color: var(--text); }
  #result-area { flex: 1; overflow: auto; }
  .result-meta { font-size: 12px; color: var(--muted); margin-bottom: 8px; padding: 6px 10px; background: var(--bg3); border-radius: 6px; }
  .result-meta span { color: var(--green); font-weight: 600; }
  .error-box { background: rgba(248,81,73,0.1); border: 1px solid var(--red); border-radius: 8px; padding: 12px; color: var(--red); font-size: 13px; font-family: monospace; }
  .exec-result { background: rgba(63,185,80,0.1); border: 1px solid var(--green); border-radius: 8px; padding: 12px; color: var(--green); font-size: 13px; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--muted); gap: 8px; }
  .empty-state .icon { font-size: 40px; }
  .schema-grid { display: grid; gap: 8px; }
  .schema-row { display: grid; grid-template-columns: 30px 1fr 120px 60px 60px; gap: 8px; padding: 8px 12px; background: var(--bg3); border-radius: 6px; font-size: 12px; align-items: center; }
  .schema-row.header { background: var(--bg4); color: var(--muted); font-weight: 600; font-size: 11px; text-transform: uppercase; }
  .type-badge { background: var(--bg4); color: var(--yellow); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px; }
  .pk-badge { background: rgba(88,166,255,0.15); color: var(--blue); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
  #pagination { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
  #pagination .page-info { font-size: 12px; color: var(--muted); flex: 1; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 3px; }
</style>
</head>
<body>
<div id="sidebar">
  <div id="sidebar-header">
    <h1>🗄️ MySQL Browser</h1>
    <p>Running on MySQL 5.7</p>
  </div>
  <div id="table-list"></div>
</div>
<div id="main">
  <div id="topbar">
    <h2 id="topbar-title">选择一个数据表</h2>
    <span class="badge" id="topbar-badge"></span>
  </div>
  <div id="content">
    <div id="tabs">
      <div class="tab active" onclick="switchTab('data')" id="tab-data">数据</div>
      <div class="tab" onclick="switchTab('schema')" id="tab-schema">结构</div>
      <div class="tab" onclick="switchTab('query')" id="tab-query">SQL 查询</div>
    </div>
    <div id="panel">
      <div class="empty-state">
        <div class="icon">🗄️</div>
        <div>从左侧选择一个数据表开始浏览</div>
      </div>
    </div>
  </div>
</div>
<script>
const BASE = '';
let currentTable = null;
let currentTab = 'data';
let offset = 0;
const PAGE = 50;
let totalRows = 0;
let tableColumns = [];

async function loadTables() {
  const r = await fetch(BASE + '/db-api/tables');
  const tables = await r.json();
  const list = document.getElementById('table-list');
  list.innerHTML = tables.map(t => \`<div class="table-item" onclick="selectTable('\${t}')" id="ti-\${t}"><span class="icon">📋</span>\${t}</div>\`).join('');
  if (tables.length > 0) selectTable(tables[0]);
}

async function selectTable(name) {
  currentTable = name;
  offset = 0;
  document.querySelectorAll('.table-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('ti-' + name);
  if (el) el.classList.add('active');
  const r = await fetch(BASE + '/db-api/table/' + name);
  const info = await r.json();
  totalRows = info.rowCount;
  tableColumns = info.columns;
  document.getElementById('topbar-title').textContent = name;
  document.getElementById('topbar-badge').textContent = totalRows + ' 行';
  renderCurrentTab();
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  renderCurrentTab();
}

function renderCurrentTab() {
  if (currentTab === 'data') renderData();
  else if (currentTab === 'schema') renderSchema();
  else renderQuery();
}

async function renderData() {
  if (!currentTable) return;
  const r = await fetch(\`\${BASE}/db-api/table/\${currentTable}/rows?limit=\${PAGE}&offset=\${offset}\`);
  const rows = await r.json();
  const panel = document.getElementById('panel');
  if (rows.length === 0 && offset === 0) {
    panel.innerHTML = '<div class="empty-state"><div class="icon">📭</div><div>此表暂无数据</div></div>';
    return;
  }
  const cols = tableColumns.map(c => c.name);
  const thead = \`<thead><tr>\${cols.map(c => '<th>' + c + '</th>').join('')}</tr></thead>\`;
  const tbody = rows.map(row => \`<tr>\${cols.map(c => {
    const v = row[c];
    if (v === null || v === undefined) return '<td><span class="null-val">NULL</span></td>';
    return '<td title="' + String(v).replace(/"/g,'&quot;') + '">' + String(v) + '</td>';
  }).join('')}</tr>\`).join('');
  const from = offset + 1, to = offset + rows.length;
  panel.innerHTML = \`
    <div class="data-table-wrap"><table>\${thead}<tbody>\${tbody}</tbody></table></div>
    <div id="pagination">
      <span class="page-info">显示 \${from}–\${to}，共 \${totalRows} 行</span>
      \${offset > 0 ? '<button class="btn btn-ghost" onclick="prevPage()">← 上一页</button>' : ''}
      \${to < totalRows ? '<button class="btn btn-blue" onclick="nextPage()">下一页 →</button>' : ''}
    </div>
  \`;
}

function nextPage() { offset += PAGE; renderData(); }
function prevPage() { offset = Math.max(0, offset - PAGE); renderData(); }

function renderSchema() {
  if (!currentTable) return;
  const panel = document.getElementById('panel');
  const header = \`<div class="schema-row header"><div>#</div><div>字段名</div><div>类型</div><div>非空</div><div>主键</div></div>\`;
  const rows = tableColumns.map(c => \`
    <div class="schema-row">
      <div style="color:var(--muted)">\${c.cid}</div>
      <div>\${c.name}</div>
      <div><span class="type-badge">\${c.type || 'ANY'}</span></div>
      <div>\${c.notnull ? '✓' : ''}</div>
      <div>\${c.pk ? '<span class="pk-badge">PK</span>' : ''}</div>
    </div>
  \`).join('');
  panel.innerHTML = \`<div class="schema-grid">\${header}\${rows}</div>\`;
}

function renderQuery() {
  const panel = document.getElementById('panel');
  panel.innerHTML = \`
    <div id="query-panel">
      <div>
        <textarea id="sql-editor" placeholder="SELECT * FROM cases LIMIT 10;&#10;&#10;-- 可以执行任何 SQL 语句"></textarea>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-blue" onclick="runQuery()">▶ 执行</button>
        <button class="btn btn-ghost" onclick="document.getElementById('sql-editor').value=''">清空</button>
        <button class="btn btn-ghost" onclick="fillSelect()">SELECT *</button>
      </div>
      <div id="result-area"></div>
    </div>
  \`;
}

function fillSelect() {
  if (currentTable) document.getElementById('sql-editor').value = 'SELECT * FROM ' + currentTable + ' LIMIT 50;';
}

async function runQuery() {
  const sql = document.getElementById('sql-editor').value.trim();
  if (!sql) return;
  const ra = document.getElementById('result-area');
  ra.innerHTML = '<div style="color:var(--muted);font-size:13px">执行中...</div>';
  try {
    const r = await fetch(BASE + '/db-api/query', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ sql }) });
    const data = await r.json();
    if (!r.ok) { ra.innerHTML = '<div class="error-box">❌ ' + data.error + '</div>'; return; }
    if (data.type === 'exec') {
      ra.innerHTML = '<div class="exec-result">✅ 执行成功 · 影响 ' + data.changes + ' 行</div>';
    } else {
      const rows = data.rows;
      if (!rows.length) { ra.innerHTML = '<div class="result-meta">查询返回 <span>0</span> 行</div>'; return; }
      const cols = Object.keys(rows[0]);
      const thead = '<thead><tr>' + cols.map(c => '<th>' + c + '</th>').join('') + '</tr></thead>';
      const tbody = rows.map(row => '<tr>' + cols.map(c => {
        const v = row[c];
        if (v === null || v === undefined) return '<td><span class="null-val">NULL</span></td>';
        return '<td title="' + String(v).replace(/"/g,'&quot;') + '">' + String(v) + '</td>';
      }).join('') + '</tr>').join('');
      ra.innerHTML = '<div class="result-meta">查询返回 <span>' + rows.length + '</span> 行</div><div class="data-table-wrap"><table>' + thead + '<tbody>' + tbody + '</tbody></table></div>';
    }
  } catch(e) { ra.innerHTML = '<div class="error-box">❌ 网络错误: ' + e.message + '</div>'; }
}

loadTables();
</script>
</body>
</html>`);
});

module.exports = router;
