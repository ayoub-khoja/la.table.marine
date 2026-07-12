const numberFormatter = new Intl.NumberFormat("fr-FR");
const percentFormatter = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return numberFormatter.format(Math.round(n));
}

/**
 * @param {number | null | undefined} value - 0..1 or 0..100 depending on isRatio
 * @param {{ isRatio?: boolean }} [options]
 * @returns {string}
 */
export function formatPercent(value, options = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0 %";
  const ratio = options.isRatio ? n : n / 100;
  return percentFormatter.format(ratio);
}

/**
 * @param {number | null | undefined} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  if (minutes <= 0) return `${secs} s`;
  return `${minutes} min ${secs.toString().padStart(2, "0")} s`;
}

/**
 * @param {string | null | undefined} isoOrDate
 * @param {{ withTime?: boolean }} [options]
 * @returns {string}
 */
export function formatFrenchDate(isoOrDate, options = {}) {
  if (!isoOrDate) return "—";
  try {
    const date = new Date(isoOrDate);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: options.withTime ? "medium" : undefined,
    }).format(date);
  } catch {
    return "—";
  }
}

/**
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatEvolutionPercent(value) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

/**
 * @param {string} dateKey - YYYYMMDD or YYYY-MM-DD or dateHour
 * @returns {string}
 */
export function formatChartDateLabel(dateKey) {
  if (!dateKey) return "";
  const raw = String(dateKey);
  if (raw.length === 8 && /^\d+$/.test(raw)) {
    const y = raw.slice(0, 4);
    const m = raw.slice(4, 6);
    const d = raw.slice(6, 8);
    return formatFrenchDate(`${y}-${m}-${d}`);
  }
  if (raw.length === 10 && raw.includes("-")) {
    return formatFrenchDate(raw);
  }
  if (raw.length >= 10 && /^\d{10}$/.test(raw.slice(0, 10))) {
    const ymd = raw.slice(0, 8);
    const hour = raw.slice(8, 10);
    const y = ymd.slice(0, 4);
    const m = ymd.slice(4, 6);
    const d = ymd.slice(6, 8);
    return `${hour}h`;
  }
  return raw;
}
