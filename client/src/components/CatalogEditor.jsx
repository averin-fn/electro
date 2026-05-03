import { useState } from "react";

/**
 * Редактор каталога — master/detail.
 *
 * Правая панель: список корневых узлов (работ/групп верхнего уровня).
 *   Клик выбирает узел для редактирования.
 *
 * Левая область: редактор выбранного корневого узла:
 *   - название и единица измерения корня
 *   - дерево дочерних узлов (подгруппы / листы-работы)
 *
 * Любые изменения локальны до нажатия «Сохранить».
 * Сохранение отправляет всё дерево одним PUT /api/works.
 */
export default function CatalogEditor({ tree, onClose, onChanged }) {
  const [draft, setDraft] = useState(() => clone(tree));
  const [selectedId, setSelectedId] = useState(
    () => (tree.length > 0 ? tree[0].id : null)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);

  const update = (next) => {
    setDraft(next);
    setDirty(true);
  };

  const save = async () => {
    try {
      setBusy(true);
      setError(null);
      const res = await fetch("/api/works", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(await res.text());
      await onChanged();
      setDirty(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (dirty && !confirm("Закрыть без сохранения изменений?")) return;
    onClose();
  };

  /* ---- операции с корневым списком ---- */
  const addRootGroup = () => {
    const node = newGroup("Новая группа");
    update([...draft, node]);
    setSelectedId(node.id);
  };

  const deleteRoot = (id) => {
    const next = draft.filter((n) => n.id !== id);
    update(next);
    if (selectedId === id) {
      setSelectedId(next.length > 0 ? next[0].id : null);
    }
  };

  const updateRoot = (node) => {
    update(draft.map((n) => (n.id === node.id ? node : n)));
  };

  const selectedNode = draft.find((n) => n.id === selectedId) || null;

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal catalog-modal" onClick={(e) => e.stopPropagation()}>
        {/* ---- Шапка ---- */}
        <div className="panel-header">
          <h2>Каталог работ</h2>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={close}>
            Закрыть
          </button>
        </div>

        {/* ---- Тело ---- */}
        <div className="catalog-body">
          {/* ЛЕВАЯ ЧАСТЬ — список корневых узлов */}
          <div className="catalog-list">
            <div className="catalog-list-header">
              <span>Работы</span>
            </div>
            <div className="catalog-list-items">
              {draft.map((n) => (
                <div
                  key={n.id}
                  className={`catalog-root-item ${selectedId === n.id ? "is-active" : ""}`}
                  onClick={() => setSelectedId(n.id)}
                >
                  <span className="catalog-root-title">{n.title || "—"}</span>
                  <button
                    className="btn btn-sm btn-icon catalog-root-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Удалить «${n.title}» и всё содержимое?`))
                        deleteRoot(n.id);
                    }}
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="catalog-list-footer">
              <button className="btn btn-sm" style={{ width: "100%" }} onClick={addRootGroup}>
                + Добавить работу
              </button>
            </div>
          </div>

          {/* ПРАВАЯ ЧАСТЬ — редактор выбранного корневого узла */}
          <div className="catalog-detail">
            {error && <div className="error">Ошибка: {error}</div>}

            {!selectedNode ? (
              <div className="hint">
                Выберите работу из списка слева или создайте новую.
              </div>
            ) : (
              <RootEditor
                node={selectedNode}
                onChange={updateRoot}
              />
            )}
          </div>
        </div>

        {/* ---- Футер ---- */}
        <div className="panel-footer sticky-footer">
          <span className="hint">
            {dirty ? "Есть несохранённые изменения" : "Сохранено"}
          </span>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={close}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={busy || !dirty}
          >
            {busy ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Редактор выбранного корневого узла:
 *   - поле названия (это и есть имя работы)
 *   - поле ед. изм. (наследуется подгруппами)
 *   - дерево дочерних узлов (уточнения)
 */
function RootEditor({ node, onChange }) {
  const set = (patch) => onChange({ ...node, ...patch });

  const isLeaf = typeof node.price === "number";

  const addChildGroup = () =>
    set({ children: [...(node.children || []), newGroup("Новая подгруппа")] });

  const addChildLeaf = () =>
    set({ children: [...(node.children || []), newLeaf("Новая работа", 0)] });

  const updateChild = (idx, child) => {
    const list = [...(node.children || [])];
    list[idx] = child;
    set({ children: list });
  };
  const removeChild = (idx) => {
    set({ children: (node.children || []).filter((_, i) => i !== idx) });
  };

  const toGroup = () =>
    onChange({ id: node.id, title: node.title, measure: node.measure, children: [] });
  const toLeaf = () =>
    onChange({ id: node.id, title: node.title, measure: node.measure, price: 0 });

  return (
    <div className="root-editor">
      {/* Поля корневого узла */}
      <div className="root-editor-fields">
        <div className="field">
          <label>Название работы</label>
          <input
            placeholder="Название"
            value={node.title || ""}
            onChange={(e) => set({ title: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Ед. изм. (наследуется уточнениями)</label>
          <input
            placeholder="м., шт., м²…"
            value={node.measure || ""}
            onChange={(e) => set({ measure: e.target.value })}
          />
        </div>
        {isLeaf && (
          <div className="field">
            <label>Цена (₽)</label>
            <input
              type="number"
              value={node.price ?? 0}
              onChange={(e) => set({ price: Number(e.target.value) })}
            />
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm" onClick={isLeaf ? toGroup : toLeaf}>
            {isLeaf ? "Добавить уточнения" : "Без уточнений (только цена)"}
          </button>
        </div>
      </div>

      {/* Уточнения */}
      {!isLeaf && (
        <div className="root-editor-children">
          <div className="root-editor-children-header">Уточнения</div>
          {(node.children || []).length === 0 && (
            <div className="hint">Нет уточнений. Добавьте подгруппы или варианты работ.</div>
          )}
          <div className="tree">
            {(node.children || []).map((c, i) => (
              <NodeEditor
                key={c.id || i}
                node={c}
                depth={0}
                onChange={(n) => updateChild(i, n)}
                onDelete={() => removeChild(i)}
              />
            ))}
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn btn-sm" onClick={addChildGroup}>
              + Подгруппа
            </button>
            <button className="btn btn-sm" onClick={addChildLeaf}>
              + Вариант работы
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Рекурсивный редактор дочернего узла (уточнений).
 */
function NodeEditor({ node, onChange, onDelete, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const isLeaf = typeof node.price === "number";

  const set = (patch) => onChange({ ...node, ...patch });

  const toGroup = () =>
    onChange({ id: node.id, title: node.title, measure: node.measure, children: [] });
  const toLeaf = () =>
    onChange({ id: node.id, title: node.title, measure: node.measure, price: 0 });

  const addChildGroup = () =>
    set({ children: [...(node.children || []), newGroup("Новая подгруппа")] });
  const addChildLeaf = () =>
    set({ children: [...(node.children || []), newLeaf("Новый вариант", 0)] });

  const updateChild = (idx, child) => {
    const list = [...(node.children || [])];
    list[idx] = child;
    set({ children: list });
  };
  const removeChild = (idx) => {
    set({ children: (node.children || []).filter((_, i) => i !== idx) });
  };

  return (
    <div className={`node node-${isLeaf ? "leaf" : "group"}`}>
      <div className="node-row">
        {!isLeaf && (
          <button
            className="btn btn-sm btn-icon collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="toggle"
          >
            {collapsed ? "▸" : "▾"}
          </button>
        )}

        <div className="node-field">
          <label className="node-label">Название</label>
          <input
            className="node-title"
            placeholder="Название"
            value={node.title || ""}
            onChange={(e) => set({ title: e.target.value })}
          />
        </div>

        {isLeaf ? (
          <>
            <div className="node-field">
              <label className="node-label">Цена (₽)</label>
              <input
                className="node-price"
                type="number"
                placeholder="0"
                value={node.price ?? 0}
                onChange={(e) => set({ price: Number(e.target.value) })}
              />
            </div>
            <div className="node-field">
              <label className="node-label">Ед. изм.</label>
              <input
                className="node-measure"
                placeholder="м., шт.…"
                value={node.measure || ""}
                onChange={(e) => set({ measure: e.target.value })}
              />
            </div>
          </>
        ) : (
          <div className="node-field">
            <label className="node-label">Ед. изм. (наследуется)</label>
            <input
              className="node-measure"
              placeholder="м., шт., м²…"
              value={node.measure || ""}
              onChange={(e) => set({ measure: e.target.value })}
            />
          </div>
        )}

        <div className="node-actions">
          <button
            className="btn btn-sm"
            onClick={isLeaf ? toGroup : toLeaf}
            title={isLeaf ? "Сделать подгруппой" : "Сделать вариантом с ценой"}
          >
            {isLeaf ? "В группу" : "В работу"}
          </button>
          <button className="btn btn-sm btn-danger" onClick={onDelete}>
            ✕
          </button>
        </div>
      </div>

      {!isLeaf && !collapsed && (
        <div className="node-children">
          {(node.children || []).map((c, i) => (
            <NodeEditor
              key={c.id || i}
              node={c}
              depth={depth + 1}
              onChange={(n) => updateChild(i, n)}
              onDelete={() => removeChild(i)}
            />
          ))}
          <div className="row node-add-row">
            <button className="btn btn-sm" onClick={addChildGroup}>
              + Подгруппа
            </button>
            <button className="btn btn-sm" onClick={addChildLeaf}>
              + Вариант
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function newGroup(title) {
  return { id: crypto.randomUUID(), title, children: [] };
}

function newLeaf(title, price) {
  return { id: crypto.randomUUID(), title, price };
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
