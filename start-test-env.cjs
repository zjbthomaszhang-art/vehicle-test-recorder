const { spawn } = require('child_process');
const os = require('os');

// 获取当前电脑的局域网 IPv4 地址
const interfaces = os.networkInterfaces();
let localIp = 'localhost';
for (const name of Object.keys(interfaces)) {
    for (const info of interfaces[name]) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (!info.internal && info.family === 'IPv4') {
            // Ignore Clash TUN adapter or typical VM adapters if needed
            // Clash usually uses 198.18.x.x
            if (info.address.startsWith('198.18.')) {
                continue;
            }
            localIp = info.address;
            break; // Find the first valid external IPv4 address
        }
    }
    if (localIp !== 'localhost') break;
}

console.log(`\n=================================================================`);
console.log(`🚀 本地测试环境正在启动 (TEST ENVIRONMENT STARTING)`);
console.log(`📡 手机端/同一局域网设备请访问: http://${localIp}:5173/`);
console.log(`=================================================================\n`);

// 启动后端
const backend = spawn('npm', ['run', 'dev:server'], { 
    stdio: 'inherit', 
    shell: true,
    cwd: __dirname
});

// 启动前端
const frontend = spawn('npm', ['run', 'dev', '--', '--host'], { 
    stdio: 'inherit', 
    shell: true,
    cwd: __dirname
});

// 捕获 Ctrl+C，一键关闭前后端
process.on('SIGINT', () => {
    console.log('\n[INFO] 正在关闭测试环境...');
    backend.kill();
    frontend.kill();
    process.exit();
});
