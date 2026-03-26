# 使用 Node.js 16.20.2
FROM node:16.20.2-slim

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装生产环境依赖
RUN npm install --production

# 复制后端代码
COPY server/ ./server/

# 创建数据目录权限 (针对 SQLite)
RUN mkdir -p /app/server && chmod -R 777 /app/server

# 暴露后端端口
EXPOSE 3001

# 启动后端服务
CMD ["node", "server/index.cjs"]
