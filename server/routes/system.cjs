const express = require('express');
const os = require('os');

const router = express.Router();

// Helper function to get local IPv4 addresses
function getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const [name, ifaces] of Object.entries(interfaces)) {
        if (!ifaces) continue;
        for (const iface of ifaces) {
            // IPv4 and non-internal only
            const family = iface.family;
            const isIpv4 = family === 'IPv4' || family === 4;
            if (isIpv4 && !iface.internal) {
                addresses.push({
                    name,
                    address: iface.address,
                    mac: iface.mac
                });
            }
        }
    }

    // Sort to prioritize real LAN subnets & physical NICs: Wi-Fi / Ethernet > 192.168.x.x > 10.x.x.x
    addresses.sort((a, b) => {
        const getScore = (item) => {
            const nameLower = (item.name || '').toLowerCase();
            const ip = item.address;
            let score = 0;

            // Physical NIC priority
            if (nameLower.includes('wlan') || nameLower.includes('wi-fi') || nameLower.includes('无线')) score += 20;
            else if (nameLower.includes('eth') || nameLower.includes('以太网') || nameLower.includes('lan')) score += 15;
            else if (nameLower.startsWith('en') || nameLower.startsWith('wl')) score += 12;

            // Virtual adapter penalties
            if (nameLower.includes('clash') || nameLower.includes('veth') || nameLower.includes('virtual') || nameLower.includes('vmnet') || nameLower.includes('tap') || nameLower.includes('tun')) {
                score -= 30;
            }

            // IP subnet scores
            if (ip.startsWith('192.168.')) score += 8;
            else if (ip.startsWith('10.')) score += 6;
            else if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) score += 4;
            else if (ip.startsWith('198.18.')) score -= 20;

            return score;
        };

        return getScore(b) - getScore(a);
    });

    return addresses;
}

// GET /api/system/network-info
router.get('/network-info', (req, res) => {
    try {
        const ips = getNetworkInterfaces();
        const serverPort = process.env.PORT || 3001;
        const primaryIp = ips.length > 0 ? ips[0].address : '127.0.0.1';

        res.json({
            success: true,
            serverPort: Number(serverPort),
            hostname: os.hostname(),
            primaryIp,
            ips
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
