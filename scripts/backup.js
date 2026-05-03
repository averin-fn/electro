#!/usr/bin/env node
/**
 * Делает резервную копию JSON-хранилища каталога перед обновлением.
 * Использование: node scripts/backup.js
 *
 * ENV:
 *   DATA_FILE   — путь до файла данных (по умолчанию server/data/works.json)
 *   BACKUP_DIR  — директория для бэкапов (по умолчанию server/data/backups)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DATA_FILE =
  process.env.DATA_FILE || path.join(ROOT, "server", "data", "works.json");
const BACKUP_DIR =
  process.env.BACKUP_DIR || path.join(ROOT, "server", "data", "backups");

if (!fs.existsSync(DATA_FILE)) {
  console.log(`[backup] нечего бэкапить, файл не найден: ${DATA_FILE}`);
  process.exit(0);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(BACKUP_DIR, `works-${stamp}.json`);
fs.copyFileSync(DATA_FILE, dest);
console.log(`[backup] создан: ${dest}`);

// Чистим бэкапы старше 30 дней.
const KEEP_DAYS = Number(process.env.BACKUP_KEEP_DAYS || 30);
const cutoff = Date.now() - KEEP_DAYS * 24 * 3600 * 1000;
for (const f of fs.readdirSync(BACKUP_DIR)) {
  const p = path.join(BACKUP_DIR, f);
  const stat = fs.statSync(p);
  if (stat.mtimeMs < cutoff) {
    fs.unlinkSync(p);
    console.log(`[backup] удалён старый бэкап: ${f}`);
  }
}
