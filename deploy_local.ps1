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

# Helper: scp a local file to an explicit remote path
function Upload($localPath, $remotePath) {
    scp -i $SSH_KEY -o StrictHostKeyChecking=no $localPath "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/${remotePath}"
    if ($LASTEXITCODE -ne 0) { throw "scp failed for $localPath" }
}

# ── src/views ──────────────────────────────────────────────────────
Upload "src/views/HomeView.jsx"            "src/views/HomeView.jsx"
Upload "src/views/AdminView.jsx"           "src/views/AdminView.jsx"
Upload "src/views/HistoryView.jsx"         "src/views/HistoryView.jsx"
Upload "src/views/DashboardView.jsx"       "src/views/DashboardView.jsx"
Upload "src/views/DefectsView.jsx"         "src/views/DefectsView.jsx"
Upload "src/views/TestView.jsx"            "src/views/TestView.jsx"
Upload "src/views/ReportView.jsx"          "src/views/ReportView.jsx"
Upload "src/views/PDCAView.jsx"            "src/views/PDCAView.jsx"
Upload "src/views/PerformanceMonitorView.jsx" "src/views/PerformanceMonitorView.jsx"

# ── src/components ─────────────────────────────────────────────────
Upload "src/components/EditSessionModal.jsx" "src/components/EditSessionModal.jsx"
Upload "src/components/CustomSelect.jsx"     "src/components/CustomSelect.jsx"
Upload "src/components/ConfirmDialog.jsx"    "src/components/ConfirmDialog.jsx"
Upload "src/components/Toast.jsx"            "src/components/Toast.jsx"
Upload "src/components/MobileNavigator.jsx"  "src/components/MobileNavigator.jsx"
Upload "src/components/ImageLightbox.jsx"    "src/components/ImageLightbox.jsx"

# ── src/utils ──────────────────────────────────────────────────────
Upload "src/utils/vinDecoder.js"    "src/utils/vinDecoder.js"
Upload "src/utils/formatters.js"    "src/utils/formatters.js"
Upload "src/utils/syncManager.js"   "src/utils/syncManager.js"
Upload "src/utils/photoUpload.js"   "src/utils/photoUpload.js"

# ── src/hooks & src/constants ──────────────────────────────────────
Upload "src/hooks/useTheme.js"           "src/hooks/useTheme.js"
Upload "src/constants.js"               "src/constants.js"
Upload "src/constants/labels.js"        "src/constants/labels.js"

# ── src root ───────────────────────────────────────────────────────
Upload "src/App.jsx"    "src/App.jsx"
Upload "src/main.jsx"   "src/main.jsx"
Upload "src/index.css"  "src/index.css"

# ── Config files ───────────────────────────────────────────────────
Upload "tailwind.config.js"  "tailwind.config.js"
Upload "vite.config.js"      "vite.config.js"
Upload "postcss.config.js"   "postcss.config.js"
Upload "package.json"        "package.json"
Upload "package-lock.json"   "package-lock.json"

# ── server (exclude uploads/ to protect production images) ─────────
Upload "server/index.cjs"      "server/index.cjs"
Upload "server/db.cjs"         "server/db.cjs"
Upload "server/utils.cjs"      "server/utils.cjs"
Upload "server/routes/cases.cjs"      "server/routes/cases.cjs"
Upload "server/routes/sessions.cjs"   "server/routes/sessions.cjs"
Upload "server/routes/bugs.cjs"       "server/routes/bugs.cjs"
Upload "server/routes/export.cjs"     "server/routes/export.cjs"
Upload "server/routes/upload.cjs"     "server/routes/upload.cjs"
Upload "server/routes/metrics.cjs"    "server/routes/metrics.cjs"
Upload "server/routes/dbViewer.cjs"   "server/routes/dbViewer.cjs"
Upload "server/routes/vinRules.cjs"   "server/routes/vinRules.cjs"

# ── nginx config ───────────────────────────────────────────────────
scp -i $SSH_KEY -o StrictHostKeyChecking=no -r nginx "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

Write-Host "Upload complete." -ForegroundColor DarkGray


Write-Host "`n[2/3] Building on server and deploying..." -ForegroundColor Yellow

$remoteScript = "set -e; cd ~/vehicle-test-recorder; echo '>>> Installing dependencies...'; /usr/bin/npm install; echo '>>> Building...'; /usr/bin/npm run build; echo '>>> Deploying...'; sudo rm -rf /var/www/vehicle-test-recorder/dist; sudo cp -r dist /var/www/vehicle-test-recorder/; sudo chown -R www-data:www-data /var/www/vehicle-test-recorder; /usr/bin/pm2 restart vehicle-recorder || /usr/bin/pm2 start /home/admin/vehicle-test-recorder/server/index.cjs --name vehicle-recorder --cwd /home/admin/vehicle-test-recorder; echo '>>> Done!'"

ssh -i $SSH_KEY -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" $remoteScript

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host "  Deployment Completed!" -ForegroundColor Green
Write-Host "  http://$REMOTE_HOST" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
