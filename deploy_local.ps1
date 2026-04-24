$ErrorActionPreference = "Stop"

$REMOTE_HOST = "47.103.7.184"
$REMOTE_USER = "admin"
$SSH_KEY     = ".\github_actions_key"
$REMOTE_DIR  = "~/vehicle-test-recorder"
$DEST        = "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Vehicle Test Recorder - Deploy Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Uploading source files..." -ForegroundColor Yellow

scp -i $SSH_KEY -o StrictHostKeyChecking=no -r src $DEST
scp -i $SSH_KEY -o StrictHostKeyChecking=no tailwind.config.js $DEST
scp -i $SSH_KEY -o StrictHostKeyChecking=no vite.config.js $DEST
scp -i $SSH_KEY -o StrictHostKeyChecking=no postcss.config.js $DEST
scp -i $SSH_KEY -o StrictHostKeyChecking=no package.json $DEST
scp -i $SSH_KEY -o StrictHostKeyChecking=no package-lock.json $DEST
# 上传 server 目录（排除 uploads 子目录，防止覆盖生产环境的用户图片！）
# 只传 *.cjs 文件和 routes/
scp -i $SSH_KEY -o StrictHostKeyChecking=no server/index.cjs "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/server/"
scp -i $SSH_KEY -o StrictHostKeyChecking=no server/db.cjs "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/server/"
scp -i $SSH_KEY -o StrictHostKeyChecking=no server/utils.cjs "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/server/"
scp -i $SSH_KEY -o StrictHostKeyChecking=no -r server/routes $DEST/server/
scp -i $SSH_KEY -o StrictHostKeyChecking=no -r nginx $DEST

Write-Host "Upload complete." -ForegroundColor DarkGray

Write-Host "`n[2/3] Building on server and deploying..." -ForegroundColor Yellow

$remoteScript = "set -e; cd ~/vehicle-test-recorder; echo '>>> Installing dependencies...'; /usr/bin/npm install --omit=dev; echo '>>> Building...'; /usr/bin/npm run build; echo '>>> Deploying...'; sudo rm -rf /var/www/vehicle-test-recorder/dist; sudo cp -r dist /var/www/vehicle-test-recorder/; sudo chown -R www-data:www-data /var/www/vehicle-test-recorder; /usr/bin/pm2 restart vehicle-recorder || /usr/bin/pm2 start /home/admin/vehicle-test-recorder/server/index.cjs --name vehicle-recorder --cwd /home/admin/vehicle-test-recorder; echo '>>> Done!'"

ssh -i $SSH_KEY -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" $remoteScript

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host "  Deployment Completed!" -ForegroundColor Green
Write-Host "  http://$REMOTE_HOST" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
