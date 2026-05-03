import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { exportToExcel } from "./utils/excel.js";
import { generateUUID } from "./utils/uuid.js";
import AddWorkPanel from "./components/AddWorkPanel.jsx";
import EstimateList from "./components/EstimateList.jsx";
import CatalogEditor from "./components/CatalogEditor.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";

/**
 * Корневой компонент приложения.
 *   - грузит дерево каталога с сервера
 *   - хранит локальный список позиций сметы
 *   - управляет темой и открытием редактора каталога
 */
export default function App() {
  const [tree, setTree] = useState([]);
  const [items, setItems] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const loadTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listWorks();
      setTree(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  // Предупреждение при закрытии вкладки, если есть несохранённая смета.
  useEffect(() => {
    const handler = (e) => {
      if (items.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [items.length]);

  const total = useMemo(
    () => items.reduce((acc, it) => acc + (it.cost || 0), 0),
    [items]
  );

  const addItem = (item) =>
    setItems((prev) => [...prev, { ...item, id: generateUUID() }]);

  const removeItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const clearAll = () => {
    if (items.length === 0) return;
    if (confirm("Очистить весь список позиций?")) setItems([]);
  };

  const handleExport = () => {
    if (items.length === 0) return;
    exportToExcel(items, total);
  };

  const handleSave = async () => {
    if (items.length === 0) return;
    const name = prompt("Название сметы:", `Смета от ${new Date().toLocaleDateString("ru-RU")}`);
    if (name === null) return; // отмена
    try {
      setSaving(true);
      await api.saveEstimate({ name: name.trim() || undefined, items, total });
    } catch (e) {
      alert("Ошибка сохранения: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadEstimate = (estimate) => {
    if (!confirm(`Загрузить смету «${estimate.name}»? Текущий список будет заменён.`)) return;
    const loaded = estimate.items.map((it) => ({ ...it, id: generateUUID() }));
    setItems(loaded);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Электро — смета</h1>
        <div className="spacer" />
        <button
          className="btn btn-sm"
          onClick={() => setHistoryOpen(true)}
          title="История сохранённых смет"
        >
          История
        </button>
        <button
          className="btn btn-sm"
          onClick={() => setEditorOpen(true)}
          title="Редактировать каталог работ"
        >
          Каталог
        </button>
        <ThemeToggle theme={theme} onChange={setTheme} />
      </header>

      <main className="layout">
        <section className="panel">
          <div className="panel-header">
            <h2>Добавить работу</h2>
          </div>
          <div className="panel-body">
            {error && <div className="error">Ошибка: {error}</div>}
            {loading ? (
              <div className="hint">
                <span className="spinner" /> Загрузка каталога…
              </div>
            ) : (
              <AddWorkPanel tree={tree} onAdd={addItem} />
            )}
          </div>
        </section>

        <section className="panel estimate-panel">
          <div className="panel-header">
            <h2>Смета {items.length > 0 && `(${items.length})`}</h2>
          </div>
          <EstimateList items={items} onRemove={removeItem} />
          <div className="panel-footer sticky-footer">
            <div className="total-bar">
              Итого: <span>{total.toLocaleString("ru-RU")} ₽</span>
            </div>
            <div className="footer-actions">
              <button
                className="btn btn-success"
                onClick={handleExport}
                disabled={items.length === 0}
              >
                Скачать XLS
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={items.length === 0 || saving}
              >
                {saving ? "Сохранение…" : "Сохранить"}
              </button>
              <button
                className="btn"
                onClick={clearAll}
                disabled={items.length === 0}
              >
                Очистить
              </button>
            </div>
          </div>
        </section>
      </main>

      {editorOpen && (
        <CatalogEditor
          tree={tree}
          onClose={() => setEditorOpen(false)}
          onChanged={loadTree}
        />
      )}

      {historyOpen && (
        <HistoryPanel
          onClose={() => setHistoryOpen(false)}
          onLoad={handleLoadEstimate}
        />
      )}
    </div>
  );
}
