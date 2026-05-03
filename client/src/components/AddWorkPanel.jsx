import { useEffect, useMemo, useState } from "react";

/**
 * Панель добавления работы.
 *
 * Каталог — дерево произвольной глубины. Пользователь идёт по нему
 * каскадными селектами, пока не выберет лист (узел с `price`).
 * Если корневой узел сразу имеет цену — ни один селект сверху не нужен.
 *
 * Свойство `measure` наследуется от ближайшего предка с этим полем.
 */
export default function AddWorkPanel({ tree, onAdd }) {
  // Путь выбора: массив id, по одному на каждый уровень.
  const [path, setPath] = useState([]);
  const [count, setCount] = useState("");

  // Сброс при изменении каталога.
  useEffect(() => {
    setPath([]);
    setCount("");
  }, [tree]);

  // Уровни, которые нужно показать как селекты.
  // Каждый уровень = { options, selectedId, ancestorTitles, measure }
  const levels = useMemo(() => buildLevels(tree, path), [tree, path]);

  // Текущий выбранный узел (последний в пути).
  const selected = useMemo(() => {
    if (path.length === 0) return null;
    return findById(tree, path[path.length - 1]);
  }, [tree, path]);

  // Если узел в пути — группа, добавляем «следующий» уровень для выбора подузла.
  const isLeaf = selected && typeof selected.price === "number";

  const measure = useMemo(() => {
    // Берём ближайшее непустое measure из выбранного пути снизу вверх.
    for (let i = path.length - 1; i >= 0; i--) {
      const n = findById(tree, path[i]);
      if (n?.measure) return n.measure;
    }
    return "";
  }, [tree, path]);

  const price = isLeaf ? selected.price : 0;
  const numericCount = Number(count) || 0;
  const cost = price * numericCount;
  const canAdd = isLeaf && numericCount > 0 && price > 0;

  const handleSelect = (levelIdx, value) => {
    const next = path.slice(0, levelIdx);
    if (value) next.push(value);
    setPath(next);
    setCount("");
  };

  const submit = () => {
    if (!canAdd) return;
    // Собираем «полное название» как путь по дереву.
    const titles = path.map((id) => findById(tree, id)?.title).filter(Boolean);
    onAdd({
      workType: titles[0] || selected.title,
      detail: titles.slice(1).join(" · "),
      fullTitle: titles.join(" · "),
      measure,
      price,
      count: numericCount,
      cost,
    });
    setCount("");
  };

  if (tree.length === 0) {
    return (
      <div className="empty">
        Каталог пуст. Откройте «Каталог» в шапке и добавьте работы.
      </div>
    );
  }

  return (
    <>
      {levels.map((lvl, i) => (
        <div className="field" key={i}>
          <label>{lvl.label}</label>
          <select
            value={lvl.selectedId || ""}
            onChange={(e) => handleSelect(i, e.target.value)}
          >
            <option value="">— выберите —</option>
            {lvl.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
                {typeof o.price === "number" ? ` — ${o.price} ₽` : ""}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="row">
        <div className="field">
          <label>Количество {measure ? `(${measure})` : ""}</label>
          <input
            type="number"
            min="0"
            step="any"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            disabled={!isLeaf}
            inputMode="decimal"
          />
        </div>
        <div className="field">
          <label>Цена</label>
          <input value={isLeaf ? `${price} ₽` : "—"} disabled />
        </div>
      </div>

      <div className="preview">
        <span>Стоимость:</span>
        <b>{cost.toLocaleString("ru-RU")} ₽</b>
      </div>

      <button className="btn btn-primary" onClick={submit} disabled={!canAdd}>
        Добавить в смету
      </button>
    </>
  );
}

/**
 * Строит массив уровней-селектов по дереву и текущему пути.
 * Если последний выбранный узел — группа, добавляем уровень для её детей.
 */
function buildLevels(tree, path) {
  const levels = [];
  let options = tree;
  let depth = 0;

  while (options && options.length > 0) {
    const selectedId = path[depth] || null;
    levels.push({
      label: depth === 0 ? "Вид работы" : "Уточнение",
      options,
      selectedId,
    });
    if (!selectedId) break;
    const node = options.find((o) => o.id === selectedId);
    if (!node || typeof node.price === "number") break;
    options = node.children || [];
    depth++;
  }
  return levels;
}

function findById(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const f = findById(n.children, id);
      if (f) return f;
    }
  }
  return null;
}
