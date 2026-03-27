# 🛫 Vehicle Test Recorder 部署与运维总则

本手册详细记录了本项目的全部部署方式，包括**全自动线上部署**及**手动后备方案**。

---

## 🏗️ 运行环境要求
- **操作系统**：Ubuntu 24.04 / 阿里云 ECS
- **运行时**：Node.js v20+ 
- **数据库**：MySQL 8.0 (监听端口 3306)
- **进程管理**：PM2 (`npm install -g pm2`)

---

## 🚀 方案 A：全自动部署 (首选)
基于 GitHub Actions 自动化流水线。修改本地代码并推送至 `main` 分支后，服务器将全自动同步。

### 1. 发布流程
```bash
git add .
git commit -m "描述您的修改"
git push origin main
```

### 2. 后端运维细节
- **环境变量**：脚本会自动读取 GitHub Secrets 中的数据库凭证并生成 `.env`。
- **端口清理**：脚本在启动前会自动执行 `fuser -k 3001/tcp`，确保端口不冲突。
- **状态查看**：在 GitHub "Actions" 标签下查看实时部署日志。

---

## 🛠️ 方案 B：手动部署 (后备)
当自动化流水线失效（如 GitHub 网络波动）时使用。

### 1. 手动 Git 同步 (最快)
```bash
ssh admin@<Server-IP>
cd ~/vehicle-test-recorder
git fetch --all && git reset --hard origin/main
npm install && npm run build
pm2 restart vehicle-recorder
```

### 2. 本地编译 + 上传 (最稳)
当服务器端构建失败时，在本地测试通过后再上传。
- **本地操作**：运行 `npm run build` 生成 `dist/` 文件夹。
- **同步文件**：将本地的 `dist/`, `server/`, `package.json` 同步至服务器。
- **执行重启**：`pm2 restart vehicle-recorder`。

---

## ⚠️ 运维自检清单 (Troubleshooting)

### 1. 数据库连不上 / 历史记录消失
- **检查配置**：确认服务器 `~/vehicle-test-recorder/.env` 文件中的密码是否为 `REDACTED`。
- **确认地址**：确保 `DB_HOST` 设置为 `127.0.0.1`。
- **自检命令**：
  ```bash
  cat .env  # 查看当前环境配置
  ```

### 2. 前端页面显示 "Saving..." 一直转圈
- **原因**：后端进程卡死或数据库握手超时。
- **解决方案**：强制杀掉之前的僵尸进程。
  ```bash
  sudo fuser -k 3001/tcp
  pm2 restart vehicle-recorder
  ```

### 3. 查看实时报错
- **快速查看**：
  ```bash
  pm2 logs vehicle-recorder --lines 100
  ```

---

## 🛡️ 数据基线 (Baseline)
目前的稳定版本已在 Git 中打标：**`v1.0.0-stable-deploy`**。
如果在任何一次更新中出现不可逆问题，可以随时通过以下命令回滚：
```bash
git checkout v1.0.0-stable-deploy
pm2 restart vehicle-recorder
```
