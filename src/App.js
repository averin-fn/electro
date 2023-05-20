import config from "./config.json";
import { useState } from "react";
import { Group } from "./components/group-component/Group";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import ExcelJS from "exceljs";

/**
 * Основной компонент приложения
 */
function App() {
  /** Поле итого и состояние */
  const [total, setTotal] = useState(0);
  /** Выбранные группы, словарик - [Имя группы]: {[массив сток]} */
  const selectedGroups = {};

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
    const sheet = workbook.addWorksheet("Смета");

    const header = sheet.getRow(1);
    header.getCell(1).value = "Вид работы";
    header.getCell(2).value = "Вид материала";
    header.getCell(3).value = "Размер";
    header.getCell(4).value = "Кол-во";
    header.getCell(5).value = "Ед.изм.";
    header.getCell(6).value = "Цена";
    header.getCell(7).value = "Стоимость";

    let rowNumber = 2;
    Object.keys(selectedGroups).forEach(key => {
      selectedGroups[key].forEach(r => {
      const row = sheet.getRow(rowNumber);
        row.getCell(1).value = key;
        row.getCell(2).value = r.materialType;
        row.getCell(3).value = r.sizeType;
        row.getCell(4).value = r.price;
        row.getCell(5).value = r.measure;
        row.getCell(6).value = r.count;
        row.getCell(7).value = r.cost;
        rowNumber++;
      });
    });
    
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
    <div>
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
        <div className="total-container">Итого: {total.toFixed(2)} р.</div>
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
