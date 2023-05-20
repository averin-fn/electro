import { useState } from "react";
import "./Row.css";

/**
 * Компонент строки в группе
 * */
export function Row({ id, header, row, data, onChange, action }) {
  // Опции размера, изменяются после выбра материала
  const [sizeOptions, setSizeOptions] = useState([]);
  // Цена
  const [price, setPrice] = useState(0);
  // Стоимость
  const [cost, setCost] = useState(0);
  // Количество
  const [count, setCount] = useState(0);

  // Если нет видов материалов, то заполняем опции для размера
  if (
    row.materialDisabled &&
    row.materialTypeOptions.length > 0 &&
    sizeOptions.length === 0
  ) {
    setSizeOptions(row.materialTypeOptions[0].sizeOptions);
  }

  // Если есть цена, то нет опций и просто задаем цену
  if (row.price && price === 0) {
    setPrice(row.price);
    data.price = row.price;
  }

  /** Обработчик изменения материала */
  function handleMaterialOnChange(event) {
    const materialType = row.materialTypeOptions.find(
      (i) => i.title === event.target.value
    );

    data.materialType = materialType.title;

    if (materialType) {
      if (materialType.price && materialType.sizeOptions.length === 0) {
        setPrice(materialType.price);
        updateCost(count, materialType.price);
      }

      setSizeOptions(materialType.sizeOptions);
    } else {
      setPrice(0);
      updateCost(count, 0);

      setSizeOptions([]);
    }
  }

  /** Обработчик изменения размера */
  function handleSizeOnChange(event) {
    const sizeType = sizeOptions.find((i) => i.title === event.target.value);

    const price = sizeType ? sizeType.price : 0;
    setPrice(price);

    data.sizeType = sizeType.title;

    updateCost(count, price);
  }

  /** Обработчик изменения количества */
  function handleCountOnChange(event) {
    const value = Number(event.target.value);
    if (isNaN(value)) {
      return;
    }

    setCount(value);

    updateCost(value, price);
  }

  /** Обновляем стоимость */
  function updateCost(count, price) {
    const totalCost = count * price;

    setCost(totalCost);

    data.price = price;
    data.cost = totalCost;

    onChange();
  }

  return header ? (
    <tr className="group-header">
      <td className="text-center">{row.number}</td>
      <td>{row.workType}</td>
      <td>
        <select
          className="form-select"
          onChange={handleMaterialOnChange}
          disabled={row.materialDisabled}
        >
          <option selected>Выберите материал</option>
          {row.materialTypeOptions.map((option, index) => (
            <option key={index} value={option.title}>
              {option.title}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          className="form-select"
          onChange={handleSizeOnChange}
          disabled={sizeOptions.length === 0}
        >
          <option selected>Выберите размер</option>
          {sizeOptions.map((option, index) => (
            <option key={index} value={option.title}>
              {option.title}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="text"
          className="form-control"
          onInput={handleCountOnChange}
          disabled={price === 0}
        />
      </td>
      <td className="text-center">{row.measure}</td>
      <td className="text-right">{price.toFixed(2)} р.</td>
      <td className="text-right">{cost.toFixed(2)} р.</td>
      <td className="text-center">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => action()}
        >
          Добавить
        </button>
      </td>
    </tr>
  ) : (
    <tr>
      <td></td>
      <td></td>
      <td>
        <select
          className="form-select"
          onChange={handleMaterialOnChange}
          disabled={row.materialDisabled}
        >
          <option selected>Выберите материал</option>
          {row.materialTypeOptions.map((option, index) => (
            <option key={index} value={option.title}>
              {option.title}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          className="form-select"
          onChange={handleSizeOnChange}
          disabled={sizeOptions.length === 0}
        >
          <option selected>Выберите размер</option>
          {sizeOptions.map((option, index) => (
            <option key={index} value={option.title}>
              {option.title}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="text"
          className="form-control"
          onChange={handleCountOnChange}
          disabled={price === 0}
        />
      </td>
      <td className="text-center">{row.measure}</td>
      <td className="text-right">{price.toFixed(2)} р.</td>
      <td className="text-right">{cost.toFixed(2)} р.</td>
      <td className="text-center">
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => action(id)}
        >
          Удалить
        </button>
      </td>
    </tr>
  );
}
