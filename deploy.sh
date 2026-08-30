#!/usr/bin/env bash
# Deploy manual ke server (mirror .github/workflows/deploy.yml).
# Env yang dibutuhkan: SERVER_HOST. Opsional: VITE_API_URL, WEB_ORIGIN,
# REMOTE_DIR (default /var/www/mrt-absensi), SSH_KEY (default pakai ssh-agent/default key).
set -euo pipefail
cd "$(dirname "$0")"

: "${SERVER_HOST:?Set SERVER_HOST, mis: SERVER_HOST=1.2.3.4 ./deploy.sh}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/mrt-absensi}"
SSH_CMD="ssh"
[ -n "${SSH_KEY:-}" ] && SSH_CMD="ssh -i $SSH_KEY"

command -v bun >/dev/null 2>&1 || { echo "bun belum terinstall: https://bun.sh" >&2; exit 1; }

echo "==> Build frontend"
(cd frontend && bun install && VITE_API_URL="${VITE_API_URL:-}" bun run build)

echo "==> Sync files ke server"
rsync -az --delete -e "$SSH_CMD" \
  --exclude node_modules --exclude 'attendance.db*' \
  backend/ "root@${SERVER_HOST}:${REMOTE_DIR}/backend/"
rsync -az --delete -e "$SSH_CMD" \
  frontend/dist/ "root@${SERVER_HOST}:${REMOTE_DIR}/frontend/dist/"
rsync -az -e "$SSH_CMD" \
  db/ "root@${SERVER_HOST}:${REMOTE_DIR}/db/"

echo "==> Install deps, migrate DB, restart pm2"
$SSH_CMD "root@${SERVER_HOST}" "
  export PATH=\$HOME/.bun/bin:\$PATH
  cd ${REMOTE_DIR}/backend
  if [ -n '${WEB_ORIGIN:-}' ]; then echo 'WEB_ORIGIN=${WEB_ORIGIN:-}' > .env; fi
  bun install
  DB_FILE=${REMOTE_DIR}/backend/attendance.db bun run db:push --force
  pm2 restart mrt-backend
  pm2 restart mrt-frontend
"
echo "==> Deploy selesai"
