#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/Artcomm}"
WEB_ROOT="${WEB_ROOT:-/var/www/html}"
CMS_SERVICE="${CMS_SERVICE:-artcomm-cms}"

cd "$APP_DIR"

git fetch origin main
git checkout main
git reset --hard origin/main
npm ci
npm run build

# CMS-файлы остаются в assets между релизами. Удаляем только собранные
# страницы и JavaScript вне этой папки, затем объединяем новую сборку с assets.
mkdir -p "$WEB_ROOT/assets"
find "$WEB_ROOT" -mindepth 1 -maxdepth 1 ! -name assets -exec rm -rf {} +
cp -a dist/. "$WEB_ROOT/"

if systemctl cat "$CMS_SERVICE" >/dev/null 2>&1; then
  systemctl restart "$CMS_SERVICE"
  echo "Restarted $CMS_SERVICE (CMS content migrations applied)"
else
  echo "WARN: systemd unit '$CMS_SERVICE' not found — CMS NOT restarted, content migrations will not apply"
fi

nginx -t
systemctl restart nginx

echo "Deploy complete"
