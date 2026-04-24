const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[upload] sharp 未安装，将使用原图直接存储。建议运行 npm install sharp');
}

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 使用内存存储，上传后再用 sharp 压缩写盘
const memStorage = multer.memoryStorage();

const upload = multer({
  storage: memStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// 压缩参数配置
const COMPRESS_QUALITY = 75;      // JPEG 质量 (0-100)
const COMPRESS_MAX_EDGE = 1920;   // 长边最大像素

// POST /api/upload  →  { url: "/uploads/env_xxx.jpg", originalSize, compressedSize }
router.post('/', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const originalSize = req.file.size;
  const filename = `env_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
  const destPath = path.join(uploadsDir, filename);

  try {
    if (sharp) {
      // 用 sharp 压缩：等比缩放（只缩不放），转为 JPEG 75%
      await sharp(req.file.buffer)
        .resize(COMPRESS_MAX_EDGE, COMPRESS_MAX_EDGE, {
          fit: 'inside',       // 保持比例，不超过边界
          withoutEnlargement: true  // 小图不放大
        })
        .jpeg({ quality: COMPRESS_QUALITY, mozjpeg: false })
        .toFile(destPath);
    } else {
      // fallback: 原图直接写盘
      fs.writeFileSync(destPath, req.file.buffer);
    }

    const compressedSize = fs.statSync(destPath).size;
    const savedPct = originalSize > 0
      ? (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)
      : '0';

    console.log(
      `[upload] ${filename} | 原始: ${(originalSize / 1024).toFixed(1)}KB` +
      ` → 压缩后: ${(compressedSize / 1024).toFixed(1)}KB (节省 ${savedPct}%)`
    );

    res.json({
      url: `/uploads/${filename}`,
      originalSize,
      compressedSize,
      savedPercent: parseFloat(savedPct)
    });
  } catch (err) {
    console.error('[upload] 压缩失败，回退原图：', err.message);
    // 压缩失败时直接写原图
    try {
      fs.writeFileSync(destPath, req.file.buffer);
      res.json({ url: `/uploads/${filename}`, originalSize, compressedSize: originalSize, savedPercent: 0 });
    } catch (writeErr) {
      res.status(500).json({ error: '文件保存失败' });
    }
  }
});

// DELETE /api/upload?file=env_xxx.jpg
router.delete('/', (req, res) => {
  const filename = req.query.file;
  if (!filename || filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filepath = path.join(uploadsDir, filename);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  res.json({ ok: true });
});

module.exports = router;
