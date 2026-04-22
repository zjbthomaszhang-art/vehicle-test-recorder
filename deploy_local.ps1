$ErrorActionPreference = "Stop"

$REMOTE_HOST = "47.103.7.184"
$REMOTE_USER = "admin"
$SSH_KEY = "C:\Users\HG\.ssh\id_rsa"
$REMOTE_DIR = "~/vehicle-test-recorder"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " Vehicle Test Recorder - Local Deploy Script " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

Write-Host "`n[1/4] Building Frontend Locally (To prevent server OOM)..." -ForegroundColor Yellow
# Run Vite build locally
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Local build failed! Aborting deployment." -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/4] Preparing Remote Directory..." -ForegroundColor Yellow
ssh -o ConnectTimeout=10 -i $SSH_KEY ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p $REMOTE_DIR"

Write-Host "`n[3/4] Uploading Files via SCP (this may take a minute)..." -ForegroundColor Yellow
Write-Host "Compressing source files..." -ForegroundColor DarkGray
if (Test-Path "deploy_temp.zip") { Remove-Item "deploy_temp.zip" -Force }
if (Test-Path "deploy_staging") { Remove-Item "deploy_staging" -Recurse -Force }
New-Item -ItemType Directory -Force -Path "deploy_staging" | Out-Null

# Copy necessary files to staging (including the newly built dist folder)
Copy-Item -Path "server", "dist", "package.json", "package-lock.json", "ecosystem.config.cjs", "nginx" -Destination "deploy_staging" -Recurse

# CRITICAL: Remove local database and uploads from staging to prevent overwriting production data
if (Test-Path "deploy_staging\server\database.sqlite") { Remove-Item "deploy_staging\server\database.sqlite" -Force }
if (Test-Path "deploy_staging\server\uploads") { Remove-Item "deploy_staging\server\uploads" -Recurse -Force }

Compress-Archive -Path "deploy_staging\*" -DestinationPath deploy_temp.zip -Force
Remove-Item "deploy_staging" -Recurse -Force

Write-Host "Transferring zip archive..." -ForegroundColor DarkGray
scp -o ConnectTimeout=10 -i $SSH_KEY deploy_temp.zip ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/deploy_temp.zip

Write-Host "`n[4/4] Executing Remote Deployment Commands..." -ForegroundColor Yellow
$remoteScript = @"
cd $REMOTE_DIR

echo '>>> Unzipping files...'
unzip -o deploy_temp.zip || true
rm deploy_temp.zip

echo '>>> Installing Backend Dependencies...'
/usr/bin/npm install --production

echo '>>> Recreating .env (Local Script)...'
echo 'PORT=3001' > .env
echo 'DB_HOST=localhost' >> .env
echo 'DB_USER=root' >> .env
echo 'DB_PASSWORD=Thom@s1983' >> .env
echo 'DB_NAME=test_recorder' >> .env
echo 'NODE_ENV=production' >> .env
chmod 600 .env

echo '>>> Configuring Nginx...'
sudo cp nginx/vehicle-recorder.conf /etc/nginx/sites-available/vehicle-recorder.conf
sudo ln -sf /etc/nginx/sites-available/vehicle-recorder.conf /etc/nginx/sites-enabled/vehicle-recorder.conf
sudo nginx -t
sudo systemctl restart nginx

echo '>>> Deploying Static Assets to /var/www/...'
sudo mkdir -p /var/www/vehicle-test-recorder
sudo rm -rf /var/www/vehicle-test-recorder/dist
sudo cp -r dist /var/www/vehicle-test-recorder/
sudo chown -R www-data:www-data /var/www/vehicle-test-recorder

echo '>>> Executing Aggressive Backend Reset...'
/usr/bin/pm2 kill || true
sudo fuser -k 3001/tcp || true
sudo lsof -t -i:3001 | xargs sudo kill -9 || true
sudo killall -9 node || true

echo '>>> Waiting for Socket Release (10s)...'
sleep 10

echo '>>> Fresh Start Backend...'
/usr/bin/pm2 delete 'vehicle-recorder' || true
/usr/bin/pm2 start /home/admin/vehicle-test-recorder/server/index.cjs --name 'vehicle-recorder' --cwd /home/admin/vehicle-test-recorder

echo '>>> Final Server Health Check...'
sleep 5
/usr/bin/pm2 status
"@

ssh -o ConnectTimeout=10 -i $SSH_KEY ${REMOTE_USER}@${REMOTE_HOST} $remoteScript

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host " Deployment Completed Successfully!" -ForegroundColor Green
Write-Host " The website is live at http://47.103.7.184" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
