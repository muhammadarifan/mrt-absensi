#!/usr/bin/env bash
# Jalankan backend + frontend lokal. Auto-check & install dependency.
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v bun >/dev/null 2>&1; then
  echo "bun belum terinstall. Install dulu: https://bun.sh (curl -fsSL https://bun.sh/install | bash)" >&2
  exit 1
fi

echo "==> Install backend deps"
(cd backend && bun install)

echo "==> Sync schema DB"
(cd backend && bun run db:push --force)

echo "==> Install frontend deps"
(cd frontend && bun install)

cleanup() { kill 0; }
trap cleanup EXIT INT TERM

echo "==> Start backend (http://localhost:3000) & frontend (http://localhost:5173)"
(cd backend && bun run dev) &
(cd frontend && bun run dev) &
wait
