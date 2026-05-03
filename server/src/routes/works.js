/**
 * REST-эндпойнты для каталога работ.
 *
 * Модель данных — дерево узлов:
 *   {
 *     id: string,
 *     title: string,
 *     measure?: string,        // ед. измерения, наследуется потомками
 *     price?: number,          // если задана — узел является листом (выбираемой работой)
 *     children?: Node[]        // если есть — узел является группой
 *   }
 *
 * Узел не должен одновременно иметь и `price`, и `children`.
 *
 *   GET    /api/works            — получить корневой массив
 *   POST   /api/works            — создать узел (опционально parentId)
 *   PUT    /api/works/:id        — заменить узел целиком (поддеревом)
 *   DELETE /api/works/:id        — удалить узел
 *   PUT    /api/works            — массовая замена корневого массива
 */
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { readAll, writeAll } from "../storage.js";

const router = Router();

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** Рекурсивная валидация и присвоение id. */
function normalizeNode(node) {
  if (!node || typeof node !== "object") throw httpError(400, "Invalid node");
  if (typeof node.title !== "string" || !node.title.trim())
    throw httpError(400, "Node title is required");

  const out = { id: node.id || randomUUID(), title: node.title.trim() };
  if (typeof node.measure === "string" && node.measure) out.measure = node.measure;

  const hasPrice = typeof node.price === "number" && !Number.isNaN(node.price);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;

  if (hasPrice && hasChildren) {
    throw httpError(400, `Node "${node.title}" cannot have both price and children`);
  }

  if (hasPrice) {
    out.price = node.price;
  } else if (Array.isArray(node.children)) {
    out.children = node.children.map(normalizeNode);
  } else {
    out.children = [];
  }

  return out;
}

function findNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (Array.isArray(n.children)) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findAndUpdate(nodes, id, fn) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return fn(nodes, i);
    if (Array.isArray(nodes[i].children)) {
      if (findAndUpdate(nodes[i].children, id, fn)) return true;
    }
  }
  return false;
}

router.get("/", async (_req, res, next) => {
  try {
    res.json(await readAll());
  } catch (e) {
    next(e);
  }
});

/** body: { parentId?, title, measure?, price?, children? } */
router.post("/", async (req, res, next) => {
  try {
    const { parentId, ...payload } = req.body || {};
    const node = normalizeNode(payload);
    const all = await readAll();

    if (parentId) {
      const parent = findNode(all, parentId);
      if (!parent) throw httpError(404, "Parent not found");
      if (typeof parent.price === "number")
        throw httpError(400, "Cannot add child to a leaf node");
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      all.push(node);
    }

    await writeAll(all);
    res.status(201).json(node);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = normalizeNode({ ...req.body, id });
    const all = await readAll();
    const ok = findAndUpdate(all, id, (arr, i) => {
      arr[i] = updated;
      return true;
    });
    if (!ok) throw httpError(404, "Not found");
    await writeAll(all);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const all = await readAll();
    const ok = findAndUpdate(all, id, (arr, i) => {
      arr.splice(i, 1);
      return true;
    });
    if (!ok) throw httpError(404, "Not found");
    await writeAll(all);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.put("/", async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) throw httpError(400, "Array required");
    const items = req.body.map(normalizeNode);
    await writeAll(items);
    res.json(items);
  } catch (e) {
    next(e);
  }
});

export default router;
