import { useEffect, useState } from "react";
import { api } from "../api.js";

/**
 * Модальная панель истории смет.
 *
 * Позволяет:
 *   - просматривать сохранённые сметы
 *   - загрузить смету (заменить текущую или добавить к ней)
 *   - удалить смету из истории
 */
export default function HistoryPanel({ onClose, onLoad }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listEstimates();
      setList(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleLoad = async (id) => {
    try {
      const estimate = await api.loadEstimate(id);
      onLoad(estimate);
      onClose();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Удалить смету из истории?")) return;
    try {
      setDeleting(id);
      await api.deleteEstimate(id);
      setList((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>История смет</h2>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={onClose}>Закрыть</button>
        </div>

        <div className="modal-body history-body">
          {error && <div className="error" style={{ margin: "12px 16px" }}>Ошибка: {error}</div>}

          {loading ? (
            <div className="hint" style={{ padding: 24, textAlign: "center" }}>
              <span className="spinner" /> Загрузка…
            </div>
          ) : list.length === 0 ? (
            <div className="empty">История пуста. Сохраните смету кнопкой «Сохранить».</div>
          ) : (
            <div className="history-list">
              {list.map((e) => (
                <div key={e.id} className="history-item">
                  <div className="history-item-info">
                    <div className="history-item-name">{e.name}</div>
                    <div className="history-item-meta">
                      {new Date(e.createdAt).toLocaleString("ru-RU")} · {e.count} поз. · {e.total.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                  <div className="history-item-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleLoad(e.id)}
                    >
                      Открыть
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(e.id)}
                      disabled={deleting === e.id}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
