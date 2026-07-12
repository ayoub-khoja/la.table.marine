/**
 * @param {string[][]} rows
 * @returns {string}
 */
export function buildCsvContent(rows) {
  const bom = "\uFEFF";
  const content = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell === null || cell === undefined ? "" : String(cell);
          if (/[;"\n\r]/.test(value)) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(";")
    )
    .join("\r\n");

  return bom + content;
}

/**
 * @param {string} filename
 * @param {string} csv
 */
export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {object} data
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 * @returns {string}
 */
export function exportOverviewCsv(data, period) {
  const rows = [
    ["Rapport Analytics — La Table Marine"],
    ["Période", `${period.startDate} → ${period.endDate}`],
    ["Exporté le", new Date().toLocaleString("fr-FR")],
    [],
    ["Indicateur", "Valeur", "Période précédente", "Évolution (%)", "Tendance"],
  ];

  (data.kpis || []).forEach((kpi) => {
    rows.push([
      kpi.label,
      kpi.value,
      kpi.previousValue,
      kpi.evolution?.percent ?? "—",
      kpi.evolution?.label ?? "—",
    ]);
  });

  return buildCsvContent(rows);
}
