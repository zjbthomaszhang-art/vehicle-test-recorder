const express = require('express');
const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { db } = require('../db.cjs');
const { getBeijingTime } = require('../utils.cjs');

// ============================================
// Image Storage Stats
// ============================================
const uploadsDir = path.join(__dirname, '../uploads');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']);
let imageCache = { count: 0, totalBytes: 0, totalMB: 0, avgKB: 0 };
let imageLastFetch = 0;

function getMemoryUsage() {
    let totalMem = os.totalmem();
    let freeMem = os.freemem();
    if (os.platform() === 'linux') {
        try {
            const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
            const totalMatch = meminfo.match(/MemTotal:\s+(\d+) kB/);
            const availMatch = meminfo.match(/MemAvailable:\s+(\d+) kB/);
            if (totalMatch && availMatch) {
                totalMem = parseInt(totalMatch[1], 10) * 1024;
                freeMem = parseInt(availMatch[1], 10) * 1024;
            }
        } catch (e) {
            // fallback to os.freemem
        }
    }
    return {
        total: totalMem / (1024 * 1024 * 1024),
        used: (totalMem - freeMem) / (1024 * 1024 * 1024)
    };
}

function fetchImageStorage() {
    if (Date.now() - imageLastFetch < 10000) return Promise.resolve(imageCache);
    return new Promise((resolve) => {
        try {
            if (!fs.existsSync(uploadsDir)) {
                imageCache = { count: 0, totalBytes: 0, totalMB: 0, avgKB: 0 };
                imageLastFetch = Date.now();
                return resolve(imageCache);
            }
            const files = fs.readdirSync(uploadsDir);
            let count = 0;
            let totalBytes = 0;
            for (const f of files) {
                const ext = path.extname(f).toLowerCase();
                if (!IMAGE_EXTS.has(ext)) continue;
                try {
                    const stat = fs.statSync(path.join(uploadsDir, f));
                    count++;
                    totalBytes += stat.size;
                } catch (_) { /* skip */ }
            }
            const totalMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
            const avgKB = count > 0 ? parseFloat((totalBytes / count / 1024).toFixed(1)) : 0;
            imageCache = { count, totalBytes, totalMB, avgKB };
            imageLastFetch = Date.now();
            resolve(imageCache);
        } catch (e) {
            resolve(imageCache);
        }
    });
}

const router = express.Router();

let prevCpus = os.cpus();
let currentCpuPercent = 0;

let prevRx = 0;
let prevTx = 0;
let currentRxKbps = 0;
let currentTxKbps = 0;

// 周期性计算 CPU 使用率
setInterval(() => {
    const cpus = os.cpus();
    let totalUser = 0, totalNice = 0, totalSys = 0, totalIdle = 0, totalIrq = 0;
    for (let cpu of cpus) {
        totalUser += cpu.times.user;
        totalNice += cpu.times.nice;
        totalSys += cpu.times.sys;
        totalIdle += cpu.times.idle;
        totalIrq += cpu.times.irq;
    }
    const total = totalUser + totalNice + totalSys + totalIdle + totalIrq;
    const idle = totalIdle;
    
    let prevTotalUser = 0, prevTotalNice = 0, prevTotalSys = 0, prevTotalIdle = 0, prevTotalIrq = 0;
    for (let cpu of prevCpus) {
        prevTotalUser += cpu.times.user;
        prevTotalNice += cpu.times.nice;
        prevTotalSys += cpu.times.sys;
        prevTotalIdle += cpu.times.idle;
        prevTotalIrq += cpu.times.irq;
    }
    const prevTotal = prevTotalUser + prevTotalNice + prevTotalSys + prevTotalIdle + prevTotalIrq;
    const prevIdle = prevTotalIdle;

    const totalDiff = total - prevTotal;
    const idleDiff = idle - prevIdle;
    
    if (totalDiff > 0) {
        currentCpuPercent = (1 - idleDiff / totalDiff) * 100;
    }
    
    prevCpus = cpus;

    // 计算网络带宽 (Linux)
    if (os.platform() === 'linux') {
        try {
            const netDev = fs.readFileSync('/proc/net/dev', 'utf8');
            const lines = netDev.split('\n');
            let totalRx = 0;
            let totalTx = 0;
            for (let i = 2; i < lines.length; i++) {
                const match = lines[i].match(/^\s*([^:]+):\s*(.*)$/);
                if (match) {
                    const name = match[1].trim();
                    if (name === 'lo' || name.startsWith('veth') || name.startsWith('docker') || name.startsWith('br-')) continue;
                    
                    const stats = match[2].trim().split(/\s+/);
                    totalRx += parseInt(stats[0], 10) || 0;
                    totalTx += parseInt(stats[8], 10) || 0;
                }
            }
            if (prevRx > 0 && prevTx > 0) {
                currentRxKbps = (totalRx - prevRx) * 8 / 1000;
                currentTxKbps = (totalTx - prevTx) * 8 / 1000;
            }
            prevRx = totalRx;
            prevTx = totalTx;
        } catch (e) {
            // ignore
        }
    } else {
        // Windows/Mac 环境下模拟网速变化
        currentRxKbps = 10 + Math.random() * 50;
        currentTxKbps = 5 + Math.random() * 20;
    }
}, 1000);

let diskCache = { total: 100, used: 28.5 }; // 默认回退数据
let diskLastFetch = 0;

function fetchDiskUsage() {
    // 缓存10秒，避免频繁派生子进程
    if (Date.now() - diskLastFetch < 10000) return Promise.resolve(diskCache);
    
    return new Promise((resolve) => {
        if (os.platform() === 'linux') {
            // Linux 下通过 df 命令获取根目录真实数据，单位为字节
            exec("df -B1 / | awk 'NR==2 {print $2, $3}'", (error, stdout) => {
                if (!error && stdout) {
                    const parts = stdout.trim().split(/\s+/);
                    if (parts.length === 2) {
                        const total = parseInt(parts[0], 10) / (1024 * 1024 * 1024);
                        const used = parseInt(parts[1], 10) / (1024 * 1024 * 1024);
                        diskCache = { total, used };
                        diskLastFetch = Date.now();
                    }
                }
                resolve(diskCache);
            });
        } else {
            // Windows/Mac 环境下为了稳定和速度，使用固定的模拟数据，在服务器上会走 Linux 分支
            diskCache = { total: 512, used: 120 + Math.random() * 2 };
            diskLastFetch = Date.now();
            resolve(diskCache);
        }
    });
}

// ============================================
// TSDB Simulator: Background Recording & Cleanup
// ============================================
setInterval(async () => {
    try {
        const mem = getMemoryUsage();
        const totalMem = mem.total;
        const usedMem = mem.used;
        
        await db.query(
            "INSERT INTO metrics_history (timestamp, cpu_percent, ram_used_gb, ram_total_gb, rx_kbps, tx_kbps) VALUES (?, ?, ?, ?, ?, ?)",
            [getBeijingTime(), currentCpuPercent, usedMem, totalMem, currentRxKbps, currentTxKbps]
        );
    } catch (e) {
        console.error('TSDB Recording Error:', e);
    }
}, 10000); // Record every 10 seconds

// Cleanup job: run every hour, delete records older than 30 days
setInterval(async () => {
    try {
        // MySQL DATE_SUB approach to clean old records
        await db.query("DELETE FROM metrics_history WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY)");
    } catch (e) {
        console.error('TSDB Cleanup Error:', e);
    }
}, 3600000);

// ============================================
// API Endpoints
// ============================================

router.get('/history', async (req, res) => {
    try {
        const range = req.query.range || '1h';
        let query = '';
        let params = [];
        
        // Use DATE_SUB based on the range to fetch data, and GROUP BY to downsample.
        // We use UNIX_TIMESTAMP(timestamp) to do the grouping easily.
        if (range === '1h') {
            // Raw 10s data for the last 1 hour
            query = `SELECT timestamp, cpu_percent as cpu, ram_used_gb as ram_used, ram_total_gb as ram_total, rx_kbps as rx, tx_kbps as tx 
                     FROM metrics_history 
                     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR) 
                     ORDER BY timestamp ASC`;
        } else if (range === '1d') {
            // Last 1 day, average per minute (DIV 60)
            query = `SELECT MIN(timestamp) as timestamp, 
                            AVG(cpu_percent) as cpu, AVG(ram_used_gb) as ram_used, AVG(ram_total_gb) as ram_total, 
                            AVG(rx_kbps) as rx, AVG(tx_kbps) as tx 
                     FROM metrics_history 
                     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 DAY) 
                     GROUP BY UNIX_TIMESTAMP(timestamp) DIV 60 
                     ORDER BY timestamp ASC`;
        } else if (range === '1w') {
            // Last 1 week, average per 10 minutes (DIV 600)
            query = `SELECT MIN(timestamp) as timestamp, 
                            AVG(cpu_percent) as cpu, AVG(ram_used_gb) as ram_used, AVG(ram_total_gb) as ram_total, 
                            AVG(rx_kbps) as rx, AVG(tx_kbps) as tx 
                     FROM metrics_history 
                     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 WEEK) 
                     GROUP BY UNIX_TIMESTAMP(timestamp) DIV 600 
                     ORDER BY timestamp ASC`;
        } else if (range === '1m') {
            // Last 1 month, average per 1 hour (DIV 3600)
            query = `SELECT MIN(timestamp) as timestamp, 
                            AVG(cpu_percent) as cpu, AVG(ram_used_gb) as ram_used, AVG(ram_total_gb) as ram_total, 
                            AVG(rx_kbps) as rx, AVG(tx_kbps) as tx 
                     FROM metrics_history 
                     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH) 
                     GROUP BY UNIX_TIMESTAMP(timestamp) DIV 3600 
                     ORDER BY timestamp ASC`;
        } else {
            return res.status(400).json({ error: 'Invalid range' });
        }
        
        const [rows] = await db.query(query);
        
        // Format to arrays that frontend expects
        const history = {
            cpuData: rows.map(r => Math.max(0, r.cpu || 0)),
            ramData: rows.map(r => Math.max(0, r.ram_used || 0)),
            rxData: rows.map(r => Math.max(0, r.rx || 0)),
            txData: rows.map(r => Math.max(0, r.tx || 0)),
            timestamps: rows.map(r => r.timestamp),
            ramTotal: rows.length > 0 ? rows[rows.length-1].ram_total : 8
        };
        
        res.json(history);
    } catch (e) {
        console.error('Metrics History Error:', e);
        res.status(500).json({ error: 'Failed to fetch metrics history' });
    }
});

router.get('/', async (req, res) => {
    try {
        const mem = getMemoryUsage();
        const totalMem = mem.total;
        const usedMem = mem.used;
        
        const [disk, imageStorage] = await Promise.all([
            fetchDiskUsage(),
            fetchImageStorage()
        ]);
        
        res.json({
            cpu: currentCpuPercent,
            network: {
                rxKbps: currentRxKbps,
                txKbps: currentTxKbps
            },
            ram: {
                total: totalMem,
                used: usedMem
            },
            disk: disk,
            imageStorage: imageStorage,
            system: {
                uptime: os.uptime(), // seconds
                loadavg: os.loadavg(), // [1m, 5m, 15m]
                type: os.type(),
                release: os.release(),
                arch: os.arch()
            }
        });
    } catch (e) {
        console.error('Metrics Error:', e);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

module.exports = router;
