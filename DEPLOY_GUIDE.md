# 🛫 Vehicle Test Recorder 部署与运维总则

本手册详细记录了本项目的全部部署方式，包括**全自动线上部署**及**手动后备方案**。

---

## 🏗️ 运行环境要求
- **操作系统**：Ubuntu 24.04 / 阿里云 ECS
- **入口服务**：Nginx (监听端口 80, 反向代理至 3001)
- **运行时**：Node.js v20+ 
- **数据库**：MySQL 8.0 (监听端口 3306)
- **进程管理**：PM2 (`npm install -g pm2`)

---

## 🚀 方案 A：全自动部署 (首选)
基于 GitHub Actions 自动化流水线。修改本地代码并推送至 `main` 分支后，服务器将全自动执行以下操作：
1. **源码同步**：同步后端服务及前端源码。
2. **构建前端**：在服务器运行 `npm run build`。
3. **Nginx 更新**：自动配置反向代理并迁移静态文件至 `/var/www/vehicle-test-recorder/` 以确保权限正确。
4. **服务重启**：PM2 自动重启后端进程。

### 1. 发布流程
```bash
git add .
git commit -m "描述您的修改"
git push origin main
```

### 2. 访问方式
- **访问地址**：`http://47.103.7.184/` (默认 80 端口，无需端口号；后端 3001 端口为内部反向代理服务，不对外暴露)。

---

## 🛠️ 方案 B：手动部署 (后备)
当自动化流水线失效（如 GitHub 网络波动）时使用。

### 1. 手动 Git 同步 (最快)
```bash
ssh admin@<Server-IP>
cd ~/vehicle-test-recorder
git fetch --all && git reset --hard origin/main
npm install && npm run build
# 执行静态文件迁移以修复 Nginx 500 权限问题
sudo cp -r dist /var/www/vehicle-test-recorder/
pm2 restart vehicle-recorder
```

### 2. 本地一键推送脚本 (绕过 GitHub)
如果 GitHub Actions 故障或者服务器上的 Git 出现冲突，可以在本地开发环境（Windows PowerShell）直接执行部署脚本：
```powershell
# 该脚本会自动打包 node_modules，上传所有代码并触发远程 PM2 重启
.\deploy_local.ps1
```

---

## 🧱 离线同步引擎 (Offline-First)
本项目已集成基于 IndexedDB 的离线同步逻辑。当处于信号盲区（如隧道、地下车库）时：
1. **自动暂存**：数据会自动进入本地队列，界面显示 **"SYNCING X ASSETS..."** 胶囊。
2. **静默同步**：网络恢复后，系统会自动将积压数据批量同步至后端数据库。
3. **数据安全**：即使直接关闭浏览器，暂存数据也不会丢失。

---

## ⚠️ 运维自检清单 (Troubleshooting)

### 1. 访问 80 端口返回 500
- **原因**：通常是 `/var/www` 下的文件夹权限不正确。
- **自检**：执行 `sudo chown -R www-data:www-data /var/www/vehicle-test-recorder`。

### 2. 数据库连不上 / 历史记录消失
- **确认配置**：检查服务器 `.env` 与 GitHub Actions Secrets 中的数据库账号、密码和地址是否一致；不要在文档或仓库中记录真实密码。

### 3. 查看实时报错
- **快速查看**：
  ```bash
  pm2 logs vehicle-recorder --lines 100
  ```

---

## 🛡️ 数据基线 (Baseline)
目前的稳定版本已在 Git 中打标：**`v1.0.0-stable-deploy`**。
回滚命令：
```bash
git checkout v1.0.0-stable-deploy
pm2 restart vehicle-recorder
```
