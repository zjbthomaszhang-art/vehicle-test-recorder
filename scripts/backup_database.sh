#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/home/admin/vehicle-test-recorder}"
ENV_FILE="${ENV_FILE:-${APP_DIR}/.env}"
BACKUP_DIR="${BACKUP_DIR:-/home/admin/backups/vehicle-test-recorder/mysql}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

read_env_value() {
    local key="$1"
    local value
    value="$(sed -n "s/^${key}=//p" "$ENV_FILE" | tail -n 1 | tr -d '\r')"
    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
        value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
        value="${value:1:${#value}-2}"
    fi
    printf '%s' "$value"
}

if [[ ! -r "$ENV_FILE" ]]; then
    echo "Database environment file is not readable: $ENV_FILE" >&2
    exit 1
fi

DB_HOST="$(read_env_value DB_HOST)"
DB_USER="$(read_env_value DB_USER)"
DB_PASSWORD="$(read_env_value DB_PASSWORD)"
DB_NAME="$(read_env_value DB_NAME)"
DB_PORT="$(read_env_value DB_PORT)"
DB_PORT="${DB_PORT:-3306}"

for required_value in DB_HOST DB_USER DB_PASSWORD DB_NAME; do
    if [[ -z "${!required_value}" ]]; then
        echo "Missing ${required_value} in $ENV_FILE" >&2
        exit 1
    fi
done

umask 077
mkdir -p "$BACKUP_DIR"

timestamp="$(date '+%Y%m%d_%H%M%S')"
backup_file="${BACKUP_DIR}/${DB_NAME}_${timestamp}.sql.gz"
checksum_file="${backup_file}.sha256"
temporary_file="$(mktemp "${BACKUP_DIR}/.${DB_NAME}_${timestamp}.XXXXXX.sql.gz")"

cleanup() {
    rm -f "$temporary_file"
}
trap cleanup EXIT

MYSQL_PWD="$DB_PASSWORD" mysqldump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --single-transaction \
    --quick \
    --skip-lock-tables \
    --no-tablespaces \
    --set-gtid-purged=OFF \
    --default-character-set=utf8mb4 \
    "$DB_NAME" | gzip -9 > "$temporary_file"

gzip -t "$temporary_file"
mv "$temporary_file" "$backup_file"
sha256sum "$backup_file" > "$checksum_file"

find "$BACKUP_DIR" -type f \
    \( -name '*.sql.gz' -o -name '*.sql.gz.sha256' \) \
    -mtime "+$RETENTION_DAYS" -delete

echo "Database backup created: $backup_file"
