/**
 * @param {import('@google-analytics/data').protos.google.analytics.data.v1beta.IRunReportResponse | null | undefined} response
 * @returns {import('@google-analytics/data').protos.google.analytics.data.v1beta.IRow[]}
 */
export function getRows(response) {
  return response?.rows || [];
}

/**
 * @param {import('@google-analytics/data').protos.google.analytics.data.v1beta.IRow} row
 * @param {number} index
 * @returns {string}
 */
export function getDimensionValue(row, index) {
  return row?.dimensionValues?.[index]?.value || "";
}

/**
 * @param {import('@google-analytics/data').protos.google.analytics.data.v1beta.IRow} row
 * @param {number} index
 * @returns {number}
 */
export function getMetricValue(row, index) {
  const raw = row?.metricValues?.[index]?.value;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {import('@google-analytics/data').protos.google.analytics.data.v1beta.IRunReportResponse | null | undefined} response
 * @returns {Record<string, number>}
 */
export function mapMetricsFromTotals(response) {
  const headers = response?.metricHeaders || [];
  const values = response?.totals?.[0]?.metricValues || [];
  const result = {};

  headers.forEach((header, index) => {
    const key = header.name || `metric_${index}`;
    result[key] = getMetricValue({ metricValues: values }, index);
  });

  return result;
}

/**
 * @param {import('@google-analytics/data').protos.google.analytics.data.v1beta.IRunReportResponse | null | undefined} response
 * @param {number} [rangeIndex=0]
 * @returns {Record<string, number>}
 */
export function mapMetricsFromRowTotals(response, rangeIndex = 0) {
  const headers = response?.metricHeaders || [];
  const row = response?.rows?.[rangeIndex];
  const totalsRow = response?.totals?.[rangeIndex];
  const result = {};

  headers.forEach((header, index) => {
    const key = header.name || `metric_${index}`;
    if (row?.metricValues?.length) {
      result[key] = getMetricValue(row, index);
    } else if (totalsRow?.metricValues?.length) {
      result[key] = getMetricValue(totalsRow, index);
    } else {
      result[key] = 0;
    }
  });

  return result;
}

/**
 * @param {import('@google-analytics/data').protos.google.analytics.data.v1beta.IRunReportResponse | null | undefined} response
 * @returns {Array<Record<string, string | number>>}
 */
export function mapDimensionMetricRows(response) {
  const dimensionHeaders = (response?.dimensionHeaders || []).map((h) => h.name || "");
  const metricHeaders = (response?.metricHeaders || []).map((h) => h.name || "");

  return getRows(response).map((row) => {
    const item = {};
    dimensionHeaders.forEach((name, index) => {
      item[name] = getDimensionValue(row, index);
    });
    metricHeaders.forEach((name, index) => {
      item[name] = getMetricValue(row, index);
    });
    return item;
  });
}

/**
 * @param {string} source
 * @param {string} medium
 * @returns {string}
 */
export function normalizeTrafficSource(source, medium) {
  const s = (source || "(direct)").toLowerCase();
  const m = (medium || "(none)").toLowerCase();

  if (s.includes("google") && m !== "organic") return "Google";
  if (s.includes("google") || m === "organic") return "Google";
  if (s.includes("instagram") || s === "ig") return "Instagram";
  if (s.includes("facebook") || s === "fb") return "Facebook";
  if (s === "(direct)" || m === "(none)" || s === "direct") return "Accès direct";
  return "Autres";
}

/**
 * @param {string} device
 * @returns {string}
 */
export function normalizeDeviceLabel(device) {
  const value = (device || "").toLowerCase();
  if (value === "mobile") return "Mobile";
  if (value === "desktop") return "Ordinateur";
  if (value === "tablet") return "Tablette";
  return device || "Autre";
}
