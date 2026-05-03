/**
 * Файловое JSON-хранилище для дерева каталога. Атомарная запись + кэш.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FILE = path.resolve(__dirname, "../data/works.json");
const SEED_FILE = path.resolve(__dirname, "../data/works.seed.json");

const DATA_FILE = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : DEFAULT_FILE;

let cache = null;

async function ensureFile() {
  await fsp.mkdir(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const seed = fs.existsSync(SEED_FILE)
      ? await fsp.readFile(SEED_FILE, "utf8")
      : "[]";
    await fsp.writeFile(DATA_FILE, seed, "utf8");
  }
}

/** Рекурсивно присваивает id всем узлам дерева, у которых их нет. */
function ensureIds(nodes) {
  let mutated = false;
  for (const n of nodes) {
    if (!n.id) {
      n.id = randomUUID();
      mutated = true;
    }
    if (Array.isArray(n.children) && ensureIds(n.children)) mutated = true;
  }
  return mutated;
}

export async function readAll() {
  if (cache) return cache;
  await ensureFile();
  const raw = await fsp.readFile(DATA_FILE, "utf8");
  const items = JSON.parse(raw);
  const mutated = ensureIds(items);
  cache = items;
  if (mutated) await writeAll(items);
  return cache;
}

export async function writeAll(items) {
  await ensureFile();
  const tmp = DATA_FILE + ".tmp";
  await fsp.writeFile(tmp, JSON.stringify(items, null, 2), "utf8");
  await fsp.rename(tmp, DATA_FILE);
  cache = items;
}

export function getDataFilePath() {
  return DATA_FILE;
}
