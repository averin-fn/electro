#!/usr/bin/env bash
# Скрипт деплоя. Запускается на целевом сервере (или через SSH из CI).
# Делает бэкап, обновляет код, ставит зависимости, собирает и перезапускает сервис.
#
# ENV:
#   APP_DIR          — рабочая директория приложения
#   SERVICE_NAME     — имя systemd-сервиса (по умолчанию electro)
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/electro}"
SERVICE_NAME="${SERVICE_NAME:-electro}"

cd "$APP_DIR"

echo "==> [1/5] Бэкап данных"
node scripts/backup.js || true

echo "==> [2/5] Получение новой версии"
git fetch --all --prune
git reset --hard origin/main

echo "==> [3/5] Установка зависимостей"
npm install --workspaces --include-workspace-root --omit=dev

echo "==> [4/5] Сборка"
npm run build

echo "==> [5/5] Перезапуск сервиса $SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager || true
