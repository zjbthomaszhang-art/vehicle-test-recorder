const express = require('express');
const router = express.Router();
const { db } = require('../db.cjs');

// GET /api/media - Fetch all media from sessions, results, and bugs
router.get('/', async (req, res) => {
    try {
        let allMedia = [];

        // 1. Fetch from test_sessions (env_photo)
        const [sessions] = await db.query('SELECT id, env_photo, timestamp FROM test_sessions WHERE env_photo IS NOT NULL AND env_photo != ""');
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
                                source: 'session',
                                session_id: session.id,
                                title: '环境照片',
                                timestamp: session.timestamp
                            });
                        });
                    }
                } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
                     allMedia.push({
                        url: parsed,
                        type: 'image',
                        source: 'session',
                        session_id: session.id,
                        title: '环境照片',
                        timestamp: session.timestamp
                    });
                }
            } catch(e) { console.error('Error parsing session media', e); }
        }

        // 2. Fetch from test_results (media)
        const [results] = await db.query(`
            SELECT tr.id, tr.session_id, tr.case_id, tr.media, tr.app_feedback_time, c.function as case_function
            FROM test_results tr
            LEFT JOIN cases c ON tr.case_id = c.id
            WHERE tr.media IS NOT NULL AND tr.media != '[]' AND tr.media != ''
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
                            timestamp: result.app_feedback_time || new Date()
                        });
                    });
                }
            } catch(e) { console.error('Error parsing result media', e); }
        }

        // 3. Fetch from bugs (media)
        const [bugs] = await db.query(`
            SELECT b.id, b.session_id, b.case_id, b.media, b.timestamp, b.description
            FROM bugs b
            WHERE b.media IS NOT NULL AND b.media != '[]' AND b.media != ''
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
                            title: `Bug #${bug.id}: ${bug.description ? bug.description.substring(0, 15) + '...' : '缺陷附件'}`,
                            timestamp: bug.timestamp
                        });
                    });
                }
            } catch(e) { console.error('Error parsing bug media', e); }
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
