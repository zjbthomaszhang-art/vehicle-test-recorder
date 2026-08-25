const fs = require('fs');
const path = require('path');
const { db } = require('./db.cjs');

async function cleanup() {
    console.log('Starting orphan cleanup...');
    let usedUrls = new Set();
    
    // 1. Sessions
    const [sessions] = await db.query('SELECT env_photo FROM test_sessions WHERE env_photo IS NOT NULL AND env_photo != ""');
    for (const s of sessions) {
        try {
            let p = s.env_photo;
            if (p.startsWith('[')) {
                JSON.parse(p).forEach(url => usedUrls.add(url));
            } else {
                usedUrls.add(p);
            }
        } catch(e) {}
    }
    
    // 2. Results
    const [results] = await db.query('SELECT media FROM test_results WHERE media IS NOT NULL AND media != "[]" AND media != ""');
    for (const r of results) {
        try {
            JSON.parse(r.media).forEach(m => usedUrls.add(m.url));
        } catch(e) {}
    }
    
    // 3. Bugs
    const [bugs] = await db.query('SELECT media FROM bugs WHERE media IS NOT NULL AND media != "[]" AND media != ""');
    for (const b of bugs) {
        try {
            JSON.parse(b.media).forEach(m => usedUrls.add(m.url));
        } catch(e) {}
    }
    
    console.log(`Found ${usedUrls.size} valid media URLs in DB.`);
    
    // Scan uploads dir
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        console.log('No uploads dir found.');
        process.exit(0);
    }
    const files = fs.readdirSync(uploadsDir);
    let deletedCount = 0;
    
    for (const f of files) {
        const url = `/uploads/${f}`;
        if (!usedUrls.has(url)) {
            console.log(`Deleting orphan: ${f}`);
            fs.unlinkSync(path.join(uploadsDir, f));
            deletedCount++;
        }
    }
    
    console.log(`Cleanup complete. Deleted ${deletedCount} orphaned files.`);
    process.exit(0);
}

cleanup().catch(console.error);
