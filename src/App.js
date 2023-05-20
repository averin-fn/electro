import config from "./config.json";
import { useState } from "react";
import { Group } from "./components/group-component/Group";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import ExcelJS from "exceljs";

/** Выбранные группы, словарик - [Имя группы]: {[массив сток]} */
const selectedGroups = {};

/**
 * Основной компонент приложения
 */
function App() {
  /** Поле итого и состояние */
  const [total, setTotal] = useState(0);

  /**
   * Обработчик изменения группы
   */
  const handleOnChange = ({ workType, rows }) => {
    selectedGroups[workType] = rows;

    let sum = 0; // Итоговая сумма
    Object.keys(selectedGroups) // Получаем все ключи из выбранных групп
      .forEach((key) => {
        // Для каждого ключа (Имя группы) получаем сумму всех строк и прибовляем к итоговой
        sum += selectedGroups[key]
          .filter((r) => r.cost)
          .reduce((a, b) => a + b.cost, 0);
      });

    setTotal(sum);

    if (Object.keys(selectedGroups).length > 0) {
      window.onbeforeunload = () => "Предупреждение";
    } else {
      window.onbeforeunload = null;
    }
  };

  /** Группы и состояние */
  const [groups, setGroups] = useState(init());

  function clear() {
    setGroups(init());
    setTotal(0);
  }

  function init() {
    return config.map((row) => ({
      id: uuidv4(),
      row: row,
      onChange: handleOnChange,
    }));
  }

  function download() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Смета", {
      pageSetup: { fitToPage: true, fitToHeight: 5, fitToWidth: 7 },
    });

    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 30;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 10;
    sheet.getColumn(6).width = 10;
    sheet.getColumn(7).width = 15;

    function setValue(cell, value, alignment) {
      cell.value = value;

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      cell.alignment = { horizontal: alignment || "left" };
    }

    const header = sheet.getRow(1);
    header.font = { bold: true };
    setValue(header.getCell(1), "Вид работы", "center");
    setValue(header.getCell(2), "Вид материала", "center");
    setValue(header.getCell(3), "Размер", "center");
    setValue(header.getCell(4), "Цена", "center");
    setValue(header.getCell(5), "Ед.изм.", "center");
    setValue(header.getCell(6), "Кол-во", "center");
    setValue(header.getCell(7), "Стоимость", "center");

    let rowNumber = 2;
    Object.keys(selectedGroups).forEach((key) => {
      selectedGroups[key]
        .filter((r) => r.cost && r.cost > 0)
        .sort((a, b) => a.number > b.number)
        .forEach((r) => {
          const row = sheet.getRow(rowNumber);
          setValue(row.getCell(1), key);
          setValue(row.getCell(2), r.materialType || "-");
          setValue(row.getCell(3), r.sizeType || "-");
          setValue(row.getCell(4), r.price + " р.", "right");
          setValue(row.getCell(5), r.measure, "center");
          setValue(row.getCell(6), r.count, "center");
          setValue(row.getCell(7), r.cost + " р.", "right");
          rowNumber++;
        });
    });

    const totalRow = sheet.getRow(rowNumber);
    setValue(totalRow.getCell(6), "Сумма:", "center");
    setValue(totalRow.getCell(7), total + " р.", "right");

    workbook.xlsx
      .writeBuffer({
        base64: true,
      })
      .then((blob) => {
        var a = document.createElement("a");
        var url = URL.createObjectURL(new Blob([blob]));
        a.href = url;
        a.download = "Смета.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  }

  return (
    <div className="main-container">
      <div className="container-fluid">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">№</th>
              <th scope="col" style={{ width: "15%" }}>
                Вид работы
              </th>
              <th scope="col">Вид материала</th>
              <th scope="col">Размер</th>
              <th scope="col" style={{ width: "110px" }}>
                Количество
              </th>
              <th scope="col" style={{ width: "80px" }}>
                Ед. изм.
              </th>
              <th scope="col" style={{ minWidth: "80px" }}>
                Цена
              </th>
              <th scope="col" style={{ minWidth: "80px" }}>
                Стоимость
              </th>
              <th scope="col" style={{ width: "115px" }}>
                Действие
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Group key={g.id} row={g.row} onChange={g.onChange} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="footer-container">
        <div className="total-container">Итого: {total} р.</div>
        <div className="action-panel">
          <button
            type="button"
            className="btn btn-success"
            onClick={() => download()}
          >
            Скачать XLS
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => clear()}
          >
            Очистить
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
