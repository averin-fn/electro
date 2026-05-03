#!/usr/bin/env bash
# Сборка и запуск приложения в production-режиме.
# Использование: ./scripts/start.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Установка зависимостей"
npm install --workspaces --include-workspace-root

echo "==> Бэкап данных"
node scripts/backup.js || true

echo "==> Сборка клиента"
npm run build

echo "==> Запуск сервера"
exec npm run start
