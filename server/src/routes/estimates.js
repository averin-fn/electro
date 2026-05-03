/**
 * REST API для истории смет.
 *
 * Смета хранится как объект:
 *   { id, name, createdAt, total, items: [...] }
 *
 * Маршруты:
 *   GET    /api/estimates          — список всех смет (без items для скорости)
 *   POST   /api/estimates          — сохранить новую смету
 *   GET    /api/estimates/:id      — получить смету с items
 *   DELETE /api/estimates/:id      — удалить смету
 */
import { Router } from "express";
import fsp from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, "../../data/estimates.json");

let cache = null;

async function readAll() {
  if (cache) return cache;
  await fsp.mkdir(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    await fsp.writeFile(DATA_FILE, "[]", "utf8");
  }
  const raw = await fsp.readFile(DATA_FILE, "utf8");
  cache = JSON.parse(raw);
  return cache;
}

async function writeAll(list) {
  const tmp = DATA_FILE + ".tmp";
  await fsp.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await fsp.rename(tmp, DATA_FILE);
  cache = list;
}

const router = Router();

// GET /api/estimates — список (без поля items чтобы не гонять большой payload)
router.get("/", async (_req, res, next) => {
  try {
    const all = await readAll();
    const summary = all.map(({ id, name, createdAt, total, items }) => ({
      id,
      name,
      createdAt,
      total,
      count: items?.length ?? 0,
    }));
    res.json(summary);
  } catch (e) {
    next(e);
  }
});

// POST /api/estimates — сохранить смету
// body: { name?, items, total }
router.post("/", async (req, res, next) => {
  try {
    const { name, items, total } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items must be an array" });
    }
    const estimate = {
      id: randomUUID(),
      name: name?.trim() || `Смета от ${new Date().toLocaleDateString("ru-RU")}`,
      createdAt: new Date().toISOString(),
      total: Number(total) || 0,
      items,
    };
    const all = await readAll();
    all.unshift(estimate);
    await writeAll(all);
    const { items: _items, ...summary } = estimate;
    res.status(201).json({ ...summary, count: items.length });
  } catch (e) {
    next(e);
  }
});

// GET /api/estimates/:id — получить полную смету с items
router.get("/:id", async (req, res, next) => {
  try {
    const all = await readAll();
    const found = all.find((e) => e.id === req.params.id);
    if (!found) return res.status(404).json({ error: "Not found" });
    res.json(found);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/estimates/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const all = await readAll();
    const next2 = all.filter((e) => e.id !== req.params.id);
    if (next2.length === all.length) {
      return res.status(404).json({ error: "Not found" });
    }
    await writeAll(next2);
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
});

export default router;
