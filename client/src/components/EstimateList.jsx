/**
 * Список добавленных позиций сметы.
 * Поля item: { id, workType, detail?, measure, price, count, cost }
 */
export default function EstimateList({ items, onRemove }) {
  if (items.length === 0) {
    return <div className="empty">Список пуст. Добавьте работы слева.</div>;
  }

  return (
    <div className="items">
      {items.map((it) => (
        <div key={it.id} className="item">
          <div className="title">{it.workType}</div>
          {it.detail && <div className="meta">{it.detail}</div>}
          <div className="qty">
            {it.count} {it.measure} × {it.price} ₽
          </div>
          <div className="cost">{it.cost.toLocaleString("ru-RU")} ₽</div>
          <div className="actions">
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onRemove(it.id)}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
