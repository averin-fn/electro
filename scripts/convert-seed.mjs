/**
 * Одноразовый конвертер: старая структура (workType/materialTypeOptions/sizeOptions)
 * → новое дерево узлов (id/title/measure/price/children).
 *
 * Запуск: node scripts/convert-seed.js <input> <output>
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const [, , inFile, outFile] = process.argv;
if (!inFile || !outFile) {
  console.error("Usage: node convert-seed.js <input> <output>");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inFile, "utf8"));

function leaf(title, price) {
  return { id: randomUUID(), title, price };
}

function convertWork(work) {
  const node = {
    id: randomUUID(),
    title: work.workType,
    measure: work.measure,
  };

  const mats = work.materialTypeOptions || [];

  // Простой случай: ни материалов, ни размеров — есть только цена.
  if (mats.length === 0 && typeof work.price === "number") {
    node.price = work.price;
    return node;
  }

  // materialDisabled: материал не выбирается, в первом элементе сразу размеры.
  if (work.materialDisabled && mats.length > 0) {
    const sizes = mats[0].sizeOptions || [];
    if (sizes.length > 0) {
      node.children = sizes.map((s) => leaf(s.title, s.price));
    } else if (typeof mats[0].price === "number") {
      node.price = mats[0].price;
    }
    return node;
  }

  // Обычный случай: материалы как подгруппы.
  node.children = mats.map((m) => {
    const sub = { id: randomUUID(), title: m.title || "—" };
    const sizes = m.sizeOptions || [];
    if (sizes.length > 0) {
      sub.children = sizes.map((s) => leaf(s.title, s.price));
    } else if (typeof m.price === "number") {
      sub.price = m.price;
    }
    return sub;
  });

  return node;
}

const result = data.map(convertWork);
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");
console.log(`Converted ${data.length} entries → ${outFile}`);
