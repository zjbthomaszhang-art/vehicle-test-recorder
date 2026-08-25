const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

async function generateServerQRCode() {
  const serverUrl = 'http://47.103.7.184:3001';
  const outputDir = path.resolve(__dirname);

  const qrOptions = {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 2,
    scale: 14, // 高清大图
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  };

  // 生成 qrcode_server.png
  const serverPath = path.join(outputDir, 'qrcode_server.png');
  await QRCode.toFile(serverPath, serverUrl, qrOptions);
  console.log(`[OK] 云服务器二维码已生成: ${serverPath} -> ${serverUrl}`);

  // 清理多余临时二维码文件（若存在）
  const extraFiles = ['qrcode_lan.png', 'qrcode_dev.png'];
  for (const file of extraFiles) {
    const fPath = path.join(outputDir, file);
    if (fs.existsSync(fPath)) {
      fs.unlinkSync(fPath);
      console.log(`[CLEANUP] 已清理: ${file}`);
    }
  }

  console.log('\n✅ qrcode_server.png (http://47.103.7.184:3001) 已成功就绪！');
}

generateServerQRCode().catch(err => {
  console.error('Failed to generate server QR code:', err);
  process.exit(1);
});
