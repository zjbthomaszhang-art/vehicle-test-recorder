#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/home/admin/vehicle-test-recorder}"
BACKUP_SCRIPT="${APP_DIR}/scripts/backup_database.sh"
LOG_DIR="${APP_DIR}/logs"
MARKER="# vehicle-test-recorder-db-backup"
SCHEDULE="${BACKUP_SCHEDULE:-30 2 * * *}"

if [[ ! -x "$BACKUP_SCRIPT" ]]; then
    echo "Backup script is not executable: $BACKUP_SCRIPT" >&2
    exit 1
fi

mkdir -p "$LOG_DIR"
chmod 700 "$LOG_DIR"

existing_crontab="$(crontab -l 2>/dev/null || true)"
filtered_crontab="$(printf '%s\n' "$existing_crontab" | grep -Fv "$MARKER" || true)"
cron_entry="${SCHEDULE} ${BACKUP_SCRIPT} >> ${LOG_DIR}/database-backup.log 2>&1 ${MARKER}"

{
    printf '%s\n' "$filtered_crontab"
    printf '%s\n' "$cron_entry"
} | sed '/^[[:space:]]*$/d' | crontab -

echo "Database backup scheduled: $SCHEDULE"
