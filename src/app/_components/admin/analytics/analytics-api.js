"use client";

/**
 * @param {string} endpoint
 * @param {URLSearchParams} params
 */
export async function fetchAnalyticsEndpoint(endpoint, params) {
  const query = params.toString();
  const url = query ? `${endpoint}?${query}` : endpoint;
  const response = await fetch(url, { credentials: "same-origin" });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || "Erreur lors du chargement des données.");
    error.status = response.status;
    error.configured = data.configured;
    throw error;
  }

  return data;
}

/**
 * @param {URLSearchParams} params
 */
export function buildPeriodQuery(params) {
  const query = new URLSearchParams();
  const range = params.get("range") || "30d";
  query.set("range", range);
  if (range === "custom") {
    const start = params.get("start");
    const end = params.get("end");
    if (start) query.set("start", start);
    if (end) query.set("end", end);
  }
  return query;
}
