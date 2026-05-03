#!/usr/bin/env bash
# Только сборка (без запуска). Используется в CI.
set -euo pipefail
cd "$(dirname "$0")/.."
npm install --workspaces --include-workspace-root
npm run build
