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

  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem("theme")
  );

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
  const [groups] = useState(init());

  function clear() {
    window.location.reload();
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

    function setValue(cell, value, alignment, bold, italic, background) {
      cell.value = value;

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      cell.alignment = { horizontal: alignment || "left" };

      cell.font = {
        bold: bold || false,
        italic: italic || false,
      };

      if (background) {
        cell.fill = {
          type: 'pattern',
          pattern:'solid',
          fgColor: { argb:'FFD3D3D3' }
        };
      }
    }

    const header = sheet.getRow(1);
    header.font = { bold: true };
    setValue(header.getCell(1), "Вид работы", "center", true, true, true);
    setValue(header.getCell(2), "Вид материала", "center", true, true, true);
    setValue(header.getCell(3), "Размер", "center", true, true, true);
    setValue(header.getCell(4), "Цена", "center", true, true, true);
    setValue(header.getCell(5), "Ед.изм.", "center", true, true, true);
    setValue(header.getCell(6), "Кол-во", "center", true, true, true);
    setValue(header.getCell(7), "Стоимость", "center", true, true, true);

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
    setValue(totalRow.getCell(6), "Сумма:", "center", true, true, true);
    setValue(totalRow.getCell(7), total + " р.", "right", true, true, true);

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

  /** Переключение темы */
  function switchTheme() {
    const theme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);
  }

  return (
    <div className="main-container" data-bs-theme={currentTheme}>
      <div className="container-fluid">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">№</th>
              <th scope="col" style={{ width: "15%" }}>
                Вид работы
              </th>
              <th scope="col" style={{ width: "20%" }}>
                Вид материала
              </th>
              <th scope="col" style={{ width: "20%" }}>
                Размер
              </th>
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
          <button
            type="button"
            className="btn btn btn-secondary"
            onClick={() => switchTheme()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-sun"
              viewBox="0 0 16 16"
            >
              <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
