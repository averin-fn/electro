# Сборка и запуск приложения в production-режиме (Windows).
# Использование: powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1

$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\.."

Write-Host "==> Установка зависимостей" -ForegroundColor Cyan
npm install --workspaces --include-workspace-root

Write-Host "==> Бэкап данных" -ForegroundColor Cyan
try { node scripts/backup.js } catch { Write-Warning $_ }

Write-Host "==> Сборка клиента" -ForegroundColor Cyan
npm run build

Write-Host "==> Запуск сервера" -ForegroundColor Cyan
npm run start
