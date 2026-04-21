const express = require('express');
const path = require('path');
require('dotenv').config();
const cors = require('cors');

const { initializeDatabase } = require('./db.cjs');
const casesRouter = require('./routes/cases.cjs');
const sessionsRouter = require('./routes/sessions.cjs');
const bugsRouter = require('./routes/bugs.cjs');
const dbViewerRouter = require('./routes/dbViewer.cjs');
const exportRouter = require('./routes/export.cjs');
const uploadRouter = require('./routes/upload.cjs');
const metricsRouter = require('./routes/metrics.cjs');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../dist')));

// Mount route modules
app.use('/api/cases', casesRouter);
app.use('/api/test-sessions', sessionsRouter);
app.use('/api/bugs', bugsRouter);
app.use('/api/export', exportRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/metrics', metricsRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/db-api', dbViewerRouter);
// /db-viewer redirects to /db-api/viewer for backwards compatibility
app.get('/db-viewer', (req, res) => res.redirect('/db-api/viewer'));

// SPA fallback: send index.html for all non-API routes (supports client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Initialize DB and start server
initializeDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Backend server running at http://localhost:${port}`);
        console.log(`DB Viewer available at http://localhost:${port}/db-viewer`);
    });
});
