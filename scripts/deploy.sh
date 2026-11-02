#!/usr/bin/env bash
# One-command production deploy without editing APP_TAG in .env.
#
#   ./scripts/deploy.sh             backup → remember the running commit → pull latest → restart
#   ./scripts/deploy.sh rollback    go back to the commit that ran before the last deploy
#   ./scripts/deploy.sh status      show the running commit and the newest DB migration
#
# Why "latest" is safe: on every push to main CI runs lint, unit tests and e2e, and only then
# builds and pushes ghcr.io/…:latest. A red run pushes nothing, so latest is always the newest
# main commit that passed. The image carries the commit in the OCI label
# org.opencontainers.image.revision, which this script reads to know what is running.
#
# APP_TAG is passed on the command line (shell env beats .env in docker compose), so .env is
# never edited or read here. Run from the repo directory on the server (e.g. /opt/tdcx).
# The app restarts and migrates itself on start (prodMigrations) – never run `pnpm migrate` by hand.
set -euo pipefail

PROJECT="${PROJECT:-tdcx}"
COMPOSE_FILES="${COMPOSE_FILES:--f docker-compose.prod.yml}"
STATE_DIR="${STATE_DIR:-.deploy}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-240}"
APP_CONTAINER="${PROJECT}-app-1"

# shellcheck disable=SC2086
dc() { docker compose -p "$PROJECT" $COMPOSE_FILES "$@"; }

log() { echo "$(date '+%H:%M:%S') $*"; }
die() { echo "LỖI: $*" >&2; exit 1; }

running_revision() {
  docker inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' \
    "$APP_CONTAINER" 2>/dev/null | cut -c1-7
}

latest_migration() {
  dc exec -T postgres psql -U postgres -d tramdungcamxuc -Atc \
    "select name from payload_migrations order by id desc limit 1" < /dev/null 2>/dev/null || true
}

wait_healthy() {
  local waited=0 state
  while [ "$waited" -lt "$HEALTH_TIMEOUT" ]; do
    state="$(docker inspect --format '{{.State.Health.Status}}' "$APP_CONTAINER" 2>/dev/null || echo missing)"
    case "$state" in
      healthy) log "app healthy sau ${waited}s"; return 0 ;;
      unhealthy) break ;;
    esac
    sleep 5
    waited=$((waited + 5))
  done
  log "app chưa healthy (trạng thái: ${state:-?}). 80 dòng log cuối:"
  dc logs app --tail 80 < /dev/null || true
  return 1
}

# Start the stack on a given tag ("" = latest) and wait for the health check.
start_tag() {
  local tag="$1"
  # Explicit `|| return 1`: set -e does not apply inside a function called from `if !`.
  APP_TAG="$tag" dc pull app < /dev/null || { log "không kéo được image app (${tag:-latest})"; return 1; }
  APP_TAG="$tag" dc --profile tools pull seed < /dev/null || log "(không kéo được image tools – bỏ qua)"
  APP_TAG="$tag" dc up -d < /dev/null || return 1
  wait_healthy
}

show_status() {
  local rev
  rev="$(running_revision)"
  echo "Commit đang chạy : ${rev:-không rõ (container chưa chạy hoặc image chưa có nhãn)}"
  echo "origin/main      : $(git rev-parse --short=7 origin/main 2>/dev/null || echo '?') (lệch → CI của commit mới chưa xong hoặc đỏ)"
  echo "Migration mới nhất: $(latest_migration)"
  [ -f "$STATE_DIR/previous" ] && echo "Bản trước (rollback): $(cat "$STATE_DIR/previous")"
  return 0
}

cmd_deploy() {
  [ -z "$(git status --porcelain --untracked-files=no)" ] ||
    die "thư mục có file đã sửa (git status). Xử lý xong rồi chạy lại – script không tự xoá thay đổi."

  log "1/5 Backup DB + media"
  ./scripts/backup.sh

  log "2/5 Ghi lại bản đang chạy để rollback"
  mkdir -p "$STATE_DIR"
  chmod 700 "$STATE_DIR"
  local prev older=""
  prev="$(running_revision)"
  [ -f "$STATE_DIR/previous" ] && older="$(cat "$STATE_DIR/previous")"
  if [ -n "$prev" ]; then
    echo "$prev" > "$STATE_DIR/previous"
    log "bản đang chạy: $prev"
  else
    log "không đọc được commit đang chạy (bản cũ chưa có nhãn) – rollback sẽ cần nhập tay APP_TAG"
  fi

  log "3/5 Lấy file compose / script mới"
  git pull --ff-only < /dev/null

  log "4/5 Kéo image latest và khởi động lại"
  if ! start_tag ""; then
    die "bản mới không lên. Chạy: ./scripts/deploy.sh rollback"
  fi

  local now
  now="$(running_revision)"
  # Nothing new on latest: keep the earlier rollback point instead of "rollback to itself".
  if [ -n "$now" ] && [ "$now" = "$prev" ] && [ -n "$older" ]; then
    echo "$older" > "$STATE_DIR/previous"
    log "latest vẫn là $now (không có bản mới) – giữ mốc rollback $older"
  fi
  echo "$(date -Is) deploy ${prev:-?} -> ${now:-?}" >> "$STATE_DIR/history.log"

  log "5/5 Kiểm tra"
  show_status
  log "Deploy xong. Mở trang chủ + /admin để kiểm tay."
}

cmd_rollback() {
  [ -f "$STATE_DIR/previous" ] ||
    die "chưa có $STATE_DIR/previous. Rollback tay: APP_TAG=sha-<7 ký tự> docker compose -p $PROJECT $COMPOSE_FILES up -d"
  local prev now
  prev="$(cat "$STATE_DIR/previous")"
  [[ "$prev" =~ ^[0-9a-f]{7}$ ]] || die "$STATE_DIR/previous không hợp lệ: $prev"
  now="$(running_revision)"
  log "Quay về sha-$prev (đang chạy: ${now:-?})"
  log "Lưu ý: migration của bản mới vẫn còn trong DB (bản cũ bỏ qua cột / bảng thừa)."
  log "Nếu dữ liệu hỏng: khôi phục backup theo docs/RUNBOOK.md mục 'Khôi phục backup / Rollback'."
  start_tag "sha-$prev" || die "bản sha-$prev cũng không lên – xem log ở trên."
  echo "$(date -Is) rollback ${now:-?} -> $prev" >> "$STATE_DIR/history.log"
  log "Đã quay về sha-$prev. Bản này chạy với APP_TAG truyền qua lệnh;"
  log "lần deploy sau (./scripts/deploy.sh) sẽ lên lại latest."
  show_status
}

case "${1:-deploy}" in
  deploy) cmd_deploy ;;
  rollback) cmd_rollback ;;
  status) show_status ;;
  *) die "lệnh không hợp lệ: $1 (deploy | rollback | status)" ;;
esac
