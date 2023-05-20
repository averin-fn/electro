import { Row } from "../row-component/Row";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * Компонент группы строк
 */
export function Group({ row, onChange }) {
  /** Тип работы */
  const workType = row.workType;

  /** Вспомогательный массив для строк */
  let _rows = [
    {
      id: uuidv4(),
      row: row,
      header: true,
      data: { number: row.number, measure: row.measure },
      onChange: () => handleOnChange(),
      action: () => handleAddClick(),
    },
  ];

  /** Обработчик изменения строки */
  const handleOnChange = () => {
    onChange({ workType: workType, rows: _rows.map((r) => r.data) });
  };

  /**
   * Список строк и состояние
   */
  const [rows, setRows] = useState(_rows);

  /** Обработчик нажатия кнопки "Добавить" */
  function handleAddClick() {
    // Добавляем к массиву строк новую строку
    _rows = [
      ..._rows,
      {
        id: uuidv4(),
        row: row,
        header: false,
        data: { number: row.number, measure: row.measure },
        onChange: () => handleOnChange(),
        action: (id) => handleRemoveClick(id),
      },
    ];

    setRows(_rows);

    // Передаем изменения ввыше
    handleOnChange();
  }

  /** Обработчик нажатия кнопки "Удалить" */
  function handleRemoveClick(id) {
    // Удаляем строку по индексу
    _rows = _rows.filter((r) => r.id !== id);
    
    setRows(_rows);

    // Передаем изменения ввыше
    handleOnChange();
  }

  return (
    <>
      {rows.map((r) => (
        <Row
          key={r.id}
          id={r.id}
          header={r.header}
          row={r.row}
          data={r.data}
          onChange={r.onChange}
          action={r.action}
        />
      ))}
    </>
  );
}
