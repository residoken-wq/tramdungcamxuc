#!/usr/bin/env bash
# Daily backup of the production stack: Postgres dump + media + private files, checksummed,
# backups older than KEEP_DAYS removed. Run from the repo directory on the server:
#
#   ./scripts/backup.sh
#
# Crontab (03:15 every day):
#   15 3 * * * cd /opt/tdcx && ./scripts/backup.sh >> /var/log/tdcx-backup.log 2>&1
#
# The app is stopped for the few seconds of the copy so DB and files match (same as RUNBOOK);
# it is restarted even when a step fails. Copy BACKUP_ROOT off the server regularly.
set -euo pipefail

PROJECT="${PROJECT:-tdcx}"
# NPM runs on another VPS (docs/plan/GO_LIVE.md), so production uses docker-compose.prod.yml only.
COMPOSE_FILES="${COMPOSE_FILES:--f docker-compose.prod.yml}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/tdcx-backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

# shellcheck disable=SC2086
dc() { docker compose -p "$PROJECT" $COMPOSE_FILES "$@"; }

case "$BACKUP_ROOT" in
  /* ) [ "$BACKUP_ROOT" != "/" ] || { echo "BACKUP_ROOT must not be /" >&2; exit 1; } ;;
  * ) echo "BACKUP_ROOT must be an absolute path" >&2; exit 1 ;;
esac
mkdir -p "$BACKUP_ROOT"
chmod 700 "$BACKUP_ROOT"
DEST="$BACKUP_ROOT/$(date +%Y%m%d-%H%M%S)"
mkdir -m 700 "$DEST"

git rev-parse HEAD > "$DEST/commit.txt"
docker inspect --format '{{index .RepoDigests 0}}' "${PROJECT}-app-1" > "$DEST/image-digest.txt" 2>/dev/null || true

trap 'dc start app < /dev/null >/dev/null 2>&1 || true' EXIT
dc stop app < /dev/null
dc exec -T postgres pg_dump -U postgres -d tramdungcamxuc -Fc < /dev/null > "$DEST/database.dump"
dc run --rm --no-deps -T --entrypoint tar app -C /app/media -czf - . < /dev/null > "$DEST/media.tar.gz"
dc run --rm --no-deps -T --entrypoint tar app -C /app/private -czf - . < /dev/null > "$DEST/private.tar.gz"
dc start app < /dev/null
trap - EXIT

# Verify the copies are readable before trusting them.
dc exec -T postgres pg_restore --list < "$DEST/database.dump" > "$DEST/database-list.txt"
tar -tzf "$DEST/media.tar.gz" > /dev/null
tar -tzf "$DEST/private.tar.gz" > /dev/null
(cd "$DEST" && sha256sum database.dump media.tar.gz private.tar.gz > SHA256SUMS)

# Only folders this script created (YYYYMMDD-HHMMSS) are rotated.
find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -name '[0-9]*-[0-9]*' -mtime +"$KEEP_DAYS" -exec rm -rf -- {} +

echo "$(date -Is) backup OK: $DEST"
