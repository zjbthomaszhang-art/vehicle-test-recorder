const express = require('express');
const router = express.Router();
const { db } = require('../db.cjs');
const fs = require('fs');
const path = require('path');

// GET /api/media - Fetch all media from sessions, results, and bugs
router.get('/', async (req, res) => {
    try {
        let allMedia = [];

        // 1. Fetch from test_sessions (env_photo)
        const [sessions] = await db.query('SELECT id, env_photo, timestamp, tester, model_year, vehicle_model FROM test_sessions WHERE env_photo IS NOT NULL AND env_photo != "" AND is_deleted = 0');
        for (const session of sessions) {
            try {
                let parsed = session.env_photo;
                if (typeof parsed === 'string' && parsed.trim().startsWith('[')) {
                    parsed = JSON.parse(parsed);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(p => {
                            allMedia.push({
                                url: p,
                                type: 'image',
                                source: 'env',
                                session_id: session.id,
                                title: '环境照片',
                                vehicle_info: (session.model_year || session.vehicle_model) ? `MY${session.model_year || ''} ${session.vehicle_model || ''}`.trim() : '',
                                tester: session.tester || 'Unknown',
                                timestamp: session.timestamp
                            });
                        });
                    }
                } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
                     allMedia.push({
                        url: parsed,
                        type: 'image',
                        source: 'env',
                        session_id: session.id,
                        title: '环境照片',
                        vehicle_info: (session.model_year || session.vehicle_model) ? `MY${session.model_year || ''} ${session.vehicle_model || ''}`.trim() : '',
                        tester: session.tester || 'Unknown',
                        timestamp: session.timestamp
                    });
                }
            } catch(e) { console.error('Error parsing session media', e); }
        }

        // 2. Fetch from test_results (media)
        const [results] = await db.query(`
            SELECT tr.id, tr.session_id, tr.case_id, tr.media, tr.app_feedback_time, c.function as case_function, ts.tester, ts.model_year, ts.vehicle_model
            FROM test_results tr
            LEFT JOIN cases c ON tr.case_id = c.id
            LEFT JOIN test_sessions ts ON tr.session_id = ts.id
            WHERE tr.media IS NOT NULL AND tr.media != '[]' AND tr.media != '' AND ts.is_deleted = 0
        `);
        for (const result of results) {
            try {
                let mediaArr = JSON.parse(result.media);
                if (Array.isArray(mediaArr)) {
                    mediaArr.forEach(m => {
                        allMedia.push({
                            url: m.url,
                            type: m.type || (m.url.endsWith('.mp4') ? 'video' : 'image'),
                            name: m.name,
                            source: 'test_result',
                            session_id: result.session_id,
                            case_id: result.case_id,
                            title: result.case_function || '用例附件',
                            vehicle_info: (result.model_year || result.vehicle_model) ? `MY${result.model_year || ''} ${result.vehicle_model || ''}`.trim() : '',
                            tester: result.tester || 'Unknown',
                            timestamp: result.app_feedback_time || new Date()
                        });
                    });
                }
            } catch(e) { console.error('Error parsing result media', e); }
        }

        // 3. Fetch from bugs (media)
        const [bugs] = await db.query(`
            SELECT b.id, b.session_id, b.case_id, b.media, b.timestamp, b.description, ts.tester, ts.model_year, ts.vehicle_model
            FROM bugs b
            LEFT JOIN test_sessions ts ON b.session_id = ts.id
            WHERE b.media IS NOT NULL AND b.media != '[]' AND b.media != '' AND ts.is_deleted = 0
        `);
        for (const bug of bugs) {
            try {
                let mediaArr = JSON.parse(bug.media);
                if (Array.isArray(mediaArr)) {
                    mediaArr.forEach(m => {
                        allMedia.push({
                            url: m.url,
                            type: m.type || (m.url.endsWith('.mp4') ? 'video' : 'image'),
                            name: m.name,
                            source: 'bug',
                            session_id: bug.session_id,
                            bug_id: bug.id,
                            case_id: bug.case_id,
                            title: `Bug #${bug.id}: ${bug.description || '缺陷附件'}`,
                            vehicle_info: (bug.model_year || bug.vehicle_model) ? `MY${bug.model_year || ''} ${bug.vehicle_model || ''}`.trim() : '',
                            tester: bug.tester || 'Unknown',
                            timestamp: bug.timestamp
                        });
                    });
                }
            } catch(e) { console.error('Error parsing bug media', e); }
        }

        // 4. Attach file sizes
        for (let m of allMedia) {
            try {
                if (m.url && m.url.startsWith('/uploads/')) {
                    const filePath = path.join(__dirname, '..', m.url);
                    if (fs.existsSync(filePath)) {
                        const stat = fs.statSync(filePath);
                        m.size = stat.size;
                    } else {
                        m.size = 0;
                    }
                } else {
                    m.size = 0;
                }
            } catch (err) {
                m.size = 0;
            }
        }

        // Sort by timestamp descending
        allMedia.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ success: true, media: allMedia });
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ success: false, message: 'Server error fetching media' });
    }
});

module.exports = router;
