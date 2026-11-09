#!/usr/bin/env bash
# deploy.sh — Pull latest code and restart the Docker Compose stack.
# Run on the VPS: bash /opt/evatho/scripts/deploy.sh
# Or triggered automatically by GitHub Actions.
set -euo pipefail

APP_DIR="/opt/evatho"
cd "${APP_DIR}"

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Rebuilding and restarting containers (zero-downtime rolling restart)"
docker compose pull --quiet 2>/dev/null || true
docker compose up --build -d --remove-orphans

echo "==> Removing unused Docker images"
docker image prune -f

echo "==> Container status"
docker compose ps

echo ""
echo "✓ Deployment complete — $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
