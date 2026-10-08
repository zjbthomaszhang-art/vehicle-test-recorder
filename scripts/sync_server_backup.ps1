param(
    [string]$RemoteHost = "47.103.7.184",
    [string]$RemoteUser = "admin",
    [string]$RemoteDatabaseDir = "/home/admin/backups/vehicle-test-recorder/mysql",
    [string]$RemoteUploadsDir = "/home/admin/vehicle-test-recorder/server/uploads",
    [int]$MaxAttemptsPerDay = 3
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
$backupRoot = Join-Path $projectRoot "backup"
$databaseDir = Join-Path $backupRoot "database"
$uploadsDir = Join-Path $backupRoot "uploads"
$logDir = Join-Path $backupRoot "logs"
$statePath = Join-Path $backupRoot ".sync-state.json"
$sshKey = Join-Path $projectRoot ".secrets\aliyun_deploy_ed25519_final"
$today = Get-Date -Format "yyyy-MM-dd"

New-Item -ItemType Directory -Force -Path $databaseDir, $uploadsDir, $logDir | Out-Null

function Write-SyncLog([string]$Message) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
    Add-Content -LiteralPath (Join-Path $logDir "sync.log") -Value $line -Encoding utf8
    Write-Output $line
}

function Read-SyncState {
    if (-not (Test-Path -LiteralPath $statePath)) {
        return [PSCustomObject]@{ date = $today; attempts = 0; successDate = ""; lastError = ""; lastSuccess = ""; lastAttempt = "" }
    }

    try {
        $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
        if ($state.date -ne $today) {
            $state.date = $today
            $state.attempts = 0
            $state.lastError = ""
        }
        return $state
    } catch {
        return [PSCustomObject]@{ date = $today; attempts = 0; successDate = ""; lastError = ""; lastSuccess = ""; lastAttempt = "" }
    }
}

function Save-SyncState($State) {
    $State | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding utf8
}

function Get-LocalFileSize([string]$Path) {
    if (Test-Path -LiteralPath $Path) {
        return (Get-Item -LiteralPath $Path).Length
    }
    return -1
}

function Convert-ToSftpPath([string]$Path) {
    return $Path.Replace('\', '/')
}

function Invoke-IncrementalDownload($ManifestRows, [string]$Kind, [string]$RemoteDir, [string]$LocalDir) {
    $pending = @()
    foreach ($row in $ManifestRows | Where-Object { $_.Kind -eq $Kind }) {
        $localPath = Join-Path $LocalDir $row.Name
        if ((Get-LocalFileSize $localPath) -ne $row.Size) {
            $pending += [PSCustomObject]@{
                RemotePath = "$RemoteDir/$($row.Name)"
                LocalPath = $localPath
            }
        }
    }

    if ($pending.Count -eq 0) {
        return 0
    }

    $batchFile = New-TemporaryFile
    try {
        $commands = foreach ($item in $pending) {
            'get "{0}" "{1}"' -f $item.RemotePath, (Convert-ToSftpPath $item.LocalPath)
        }
        Set-Content -LiteralPath $batchFile -Value $commands -Encoding ascii

        $sftpOutput = & sftp.exe -q -b $batchFile -i $sshKey `
            -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=yes `
            "${RemoteUser}@${RemoteHost}" 2>&1
        if ($LASTEXITCODE -ne 0) {
            $details = ($sftpOutput | Select-Object -Last 5) -join " "
            throw "SFTP download failed for $Kind files (exit code $LASTEXITCODE): $details"
        }
    } finally {
        Remove-Item -LiteralPath $batchFile -Force -ErrorAction SilentlyContinue
    }

    return $pending.Count
}

function Test-DatabaseChecksums {
    $checksumFiles = Get-ChildItem -LiteralPath $databaseDir -Filter "*.sql.gz.sha256" -File
    foreach ($checksumFile in $checksumFiles) {
        $checksumLine = (Get-Content -Raw -LiteralPath $checksumFile.FullName).Trim()
        $expectedHash = ($checksumLine -split '\s+')[0].ToUpperInvariant()
        $dataPath = $checksumFile.FullName.Substring(0, $checksumFile.FullName.Length - ".sha256".Length)
        if (-not (Test-Path -LiteralPath $dataPath)) {
            throw "Missing database archive for checksum: $($checksumFile.Name)"
        }
        $actualHash = (Get-FileHash -LiteralPath $dataPath -Algorithm SHA256).Hash
        if ($actualHash -ne $expectedHash) {
            throw "Checksum mismatch: $([System.IO.Path]::GetFileName($dataPath))"
        }
    }
}

$state = Read-SyncState
if ($state.successDate -eq $today) {
    Write-SyncLog "Today's server backup is already synchronized; skipping."
    exit 0
}

$state.attempts = [int]$state.attempts + 1
$state.date = $today

try {
    if (-not (Test-Path -LiteralPath $sshKey)) {
        throw "SSH key not found: $sshKey"
    }

    $remoteCommand = @"
set -e
find '$RemoteDatabaseDir' -maxdepth 1 -type f \( -name '*.sql.gz' -o -name '*.sql.gz.sha256' \) -printf 'DB\t%f\t%s\n'
find '$RemoteUploadsDir' -maxdepth 1 -type f -printf 'UPLOAD\t%f\t%s\n'
"@

    $manifestOutput = & ssh.exe -i $sshKey `
        -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=yes `
        "${RemoteUser}@${RemoteHost}" $remoteCommand
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to read the server backup manifest (exit code $LASTEXITCODE)."
    }

    $manifest = foreach ($line in $manifestOutput) {
        $parts = $line -split "`t"
        if ($parts.Count -eq 3 -and $parts[0] -in @("DB", "UPLOAD")) {
            [PSCustomObject]@{
                Kind = $parts[0]
                Name = $parts[1]
                Size = [int64]$parts[2]
            }
        }
    }

    if (-not ($manifest | Where-Object { $_.Kind -eq "DB" -and $_.Name -like "*.sql.gz" })) {
        throw "No database backup archive was found on the server."
    }

    $databaseCount = Invoke-IncrementalDownload $manifest "DB" $RemoteDatabaseDir $databaseDir
    $uploadCount = Invoke-IncrementalDownload $manifest "UPLOAD" $RemoteUploadsDir $uploadsDir
    Test-DatabaseChecksums

    $state.successDate = $today
    $state.lastError = ""
    $state.lastSuccess = (Get-Date).ToString("o")
    Save-SyncState $state
    Write-SyncLog "Synchronization succeeded: $databaseCount database files and $uploadCount upload files downloaded."
    exit 0
} catch {
    $state.lastError = $_.Exception.Message
    $state.lastAttempt = (Get-Date).ToString("o")
    Save-SyncState $state
    Write-SyncLog "Synchronization attempt $($state.attempts) failed: $($state.lastError)"

    $isFinalScheduledAttempt = (Get-Date).Hour -ge 14
    if ($state.attempts -ge $MaxAttemptsPerDay -or $isFinalScheduledAttempt) {
        Write-Error "All synchronization attempts for $today have failed. The next attempt is the next workday."
        exit 1
    }

    # Noon and 13:00 failures are expected to be retried by the next scheduled run.
    exit 0
}
