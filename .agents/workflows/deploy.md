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

## 方案三：使用集成启动脚本

直接运行 `node server/index.cjs` 适用于测试环境或简单的个人使用。
