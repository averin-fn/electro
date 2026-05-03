/**
 * Экспорт сметы в XLSX через ExcelJS.
 * Колонки: Вид работы | Уточнение | Цена | Ед.изм. | Кол-во | Стоимость
 */
import ExcelJS from "exceljs";

export async function exportToExcel(items, total) {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Смета", {
    pageSetup: { fitToPage: true, fitToHeight: 5, fitToWidth: 7 },
  });

  const widths = [32, 40, 14, 12, 12, 16];
  widths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));

  const setCell = (cell, value, alignment, opts = {}) => {
    cell.value = value;
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = { horizontal: alignment || "left", vertical: "middle", wrapText: true };
    cell.font = { bold: !!opts.bold, italic: !!opts.italic };
    if (opts.bg) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };
    }
  };

  const header = sheet.getRow(1);
  ["Вид работы", "Уточнение", "Цена", "Ед.изм.", "Кол-во", "Стоимость"].forEach(
    (title, i) =>
      setCell(header.getCell(i + 1), title, "center", {
        bold: true,
        italic: true,
        bg: true,
      })
  );

  let r = 2;
  for (const it of items) {
    const row = sheet.getRow(r++);
    setCell(row.getCell(1), it.workType);
    setCell(row.getCell(2), it.detail || "-");
    setCell(row.getCell(3), it.price + " ₽", "right");
    setCell(row.getCell(4), it.measure || "-", "center");
    setCell(row.getCell(5), it.count, "center");
    setCell(row.getCell(6), it.cost + " ₽", "right");
  }

  const totalRow = sheet.getRow(r);
  setCell(totalRow.getCell(5), "Сумма:", "center", {
    bold: true,
    italic: true,
    bg: true,
  });
  setCell(totalRow.getCell(6), total + " ₽", "right", {
    bold: true,
    italic: true,
    bg: true,
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Смета.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
