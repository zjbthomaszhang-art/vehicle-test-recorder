---
description: 如何部署 Vehicle Test Recorder 后端
---

# 部署指南

本文档介绍如何将 vehicle-test-recorder 后端部署到生产环境。

## 方案一：使用 PM2 (推荐用于基础服务器)

PM2 是 Node.js 的进程管理器，可以保证服务故障后自动重启。

1. **环境准备**
   确保服务器已安装 Node.js 和 npm。

2. **复制代码**
   将 `server/` 文件夹和 `package.json` 上传到服务器。

3. **安装依赖**
   ```bash
   npm install --production
   ```

4. **启动服务**
   ```bash
   npm install -g pm2
   pm2 start server/index.cjs --name "vehicle-backend"
   ```

5. **设置开机自启**
   ```bash
   pm2 save
   pm2 startup
   ```

## 方案二：使用 Docker (推荐用于容器化环境)

1. **构建镜像**
   在项目根目录下执行：
   ```bash
   docker build -t vehicle-recorder-backend .
   ```

2. **运行容器**
   将主机上的数据库文件挂载到容器中以持久化数据：
   ```bash
   docker run -d \
     -p 3001:3001 \
     -v $(pwd)/server/database.sqlite:/app/server/database.sqlite \
     --name vehicle-backend \
     vehicle-recorder-backend
   ```

## 方案三：本地一键推送脚本 (绕过 GitHub)

当自动化流水线失效时，可以使用项目根目录提供的 PowerShell 脚本直接上传并部署：
1. **执行部署脚本**
   在 Windows 的 PowerShell 终端中执行：
   ```powershell
   .\deploy_local.ps1
   ```
2. **脚本流程**
   - 自动在本地打包 `node_modules`。
   - 使用 SSH/SCP 将核心代码和静态文件上传至服务器。
   - 自动在服务器上覆盖前端 `dist` 目录并重启 PM2 服务。

## 方案四：使用集成启动脚本

直接运行 `node server/index.cjs` 适用于测试环境或简单的个人使用。

---

## ✅ 部署后验证（必做）

> **每次部署后都必须执行以下检查，否则无法判断新代码是否已真正生效。**
> 过去曾多次出现"部署脚本报成功，但服务器运行的仍是旧代码"的问题，根本原因是 Vite 构建缓存导致 bundle 内容未更新。

### 1. 确认服务器 JS 文件 hash 与本地一致

部署完成后，运行以下命令对比服务器上实际部署的 JS 文件 hash：

```powershell
# 查看服务器上当前加载的 JS 文件名（hash）
ssh -i .\github_actions_key -o StrictHostKeyChecking=no admin@47.103.7.184 `
  "cat /var/www/vehicle-test-recorder/dist/index.html"
```

对比本地 `dist/index.html` 中的 `<script src="/assets/index-XXXXXXXX.js">` 里的 hash。
**两者必须一致**，否则说明服务器上运行的是旧版本。

### 2. 确认关键代码已编译进 bundle

使用 `grep` 验证某个关键字符串已存在于服务器的 bundle 中（**注意：Vite 会对变量名做 minification，所以只能用字符串字面量，不能用变量名**）：

```powershell
# 示例：验证某段 UI 文本或 API 路径已打进 bundle
ssh -i .\github_actions_key -o StrictHostKeyChecking=no admin@47.103.7.184 `
  "grep -c '关联用例' /var/www/vehicle-test-recorder/dist/assets/index-XXXXXXXX.js"
# 输出 > 0 表示已包含
```

> ⚠️ 不要用变量名（如 `targetIndex`、`linkedCase`）做 grep，它们会被 minifier 压缩为单字母。

### 3. 强制清缓存后浏览器验证

1. 在浏览器中按 `Ctrl+F5`（Windows）或 `Cmd+Shift+R`（Mac）强制刷新
2. 打开 DevTools → Network → 找到 `index-XXXXXXXX.js`，确认其 hash 与服务器一致
3. 操作对应功能，确认 UI 行为已更新

---

## ⚠️ 常见陷阱：Vite 构建缓存导致旧 bundle 被打包

**症状**：deploy 脚本报"成功"，但服务器行为与本地代码不符，多次重新部署依然无效。

**根本原因**：Vite 在 `node_modules/.vite` 目录缓存模块编译结果。如果缓存未失效，`npm run build` 只会重新编译少数变化的模块（如只显示 `✓ 43 modules transformed`，而非正常的 `✓ 1985 modules transformed`），导致生成的 bundle hash 不变，未包含最新代码改动。

**解决方案**：`deploy_local.ps1` 已在 `[3/4] Building locally` 步骤前自动清除缓存：
```powershell
Remove-Item -Recurse -Force .\dist
Remove-Item -Recurse -Force .\node_modules\.vite
```
若手动构建，也需要先执行以上两条命令。

**判断标准**：全量构建应显示 `✓ 1985 modules transformed`（或接近的数字）。如果只有几十个，说明是缓存构建，需要清缓存重来。
