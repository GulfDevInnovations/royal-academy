#!/usr/bin/env bash
set -euo pipefail

# Minimal VPS code update script.
#
# What it does:
# - SSH to the VPS
# - `git fetch` + `git reset --hard origin/<branch>` inside the repo dir
#
# What it does NOT do:
# - No npm install
# - No build
# - No Prisma migrate/db push
# - No PM2 restart
# - No Nginx reload
#
# Required env vars:
#   VPS_USER  (ssh username)
#
# Optional env vars:
#   VPS_PORT=22
#   VPS_PATH=/var/www/royal
#   VPS_BRANCH=main
#
# Usage:
#   VPS_USER=root npm run deploy

VPS_HOST="212.227.250.70"

: "${VPS_USER:?Set VPS_USER (ssh username)}"

VPS_PORT="${VPS_PORT:-22}"
VPS_PATH="${VPS_PATH:-/var/www/royal}"
VPS_BRANCH="${VPS_BRANCH:-main}"

REMOTE="${VPS_USER}@${VPS_HOST}"

SSH_OPTS=(
  -p "$VPS_PORT"
  -o BatchMode=yes
  -o StrictHostKeyChecking=accept-new
)

say() {
  printf "\n==> %s\n" "$*"
}

say "Updating code on ${REMOTE}:${VPS_PATH} (branch: ${VPS_BRANCH})"

say "Running remote git update"
ssh "${SSH_OPTS[@]}" \
  "$REMOTE" \
  VPS_PATH="$VPS_PATH" \
  VPS_BRANCH="$VPS_BRANCH" \
  bash -seu <<'EOF'
  set -euo pipefail

  cd "$VPS_PATH"

  echo "[remote] Updating code (origin/${VPS_BRANCH})"
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "[remote] ERROR: ${VPS_PATH} is not a git repository"
    exit 1
  fi

  git fetch origin "$VPS_BRANCH"
  git checkout "$VPS_BRANCH" >/dev/null 2>&1 || true
  git reset --hard "origin/${VPS_BRANCH}"
  git clean -fd

  echo "[remote] Done"
EOF

say "Deploy complete"
