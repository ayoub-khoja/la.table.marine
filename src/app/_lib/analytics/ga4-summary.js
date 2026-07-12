import { formatEvolutionPercent, formatNumber } from "./ga4-format";
import { safeConversionRate } from "./ga4-periods";

/**
 * @param {object} input
 * @param {import('./ga4-periods').AnalyticsPeriod} input.period
 * @param {Array<{ id: string, label: string, value: number, evolution: { percent: number | null, direction: string, label: string } }>} input.kpis
 * @param {Array<{ label: string, sessions: number }>} [input.sources]
 * @param {Array<{ title: string, path: string, views: number }>} [input.pages]
 * @param {number} [input.sessions]
 * @returns {string}
 */
export function buildPeriodSummary({ period, kpis, sources = [], pages = [], sessions = 0 }) {
  const usersKpi = kpis.find((k) => k.id === "activeUsers");
  const reservationsKpi = kpis.find((k) => k.id === "reservation_completed");
  const users = usersKpi?.value || 0;
  const reservations = reservationsKpi?.value || 0;
  const evolution = usersKpi?.evolution;

  const parts = [];

  parts.push(
    `Le site a reçu ${formatNumber(users)} utilisateur${users > 1 ? "s" : ""} sur la période du ${period.startDate} au ${period.endDate}.`
  );

  if (evolution && evolution.percent !== null) {
    parts.push(
      `Cela représente une ${evolution.label.toLowerCase()} de ${formatEvolutionPercent(evolution.percent)} par rapport à la période précédente.`
    );
  } else if (evolution?.direction === "neutral") {
    parts.push("Aucune comparaison n'est disponible pour cette période.");
  }

  const topSource = sources[0];
  if (topSource?.label) {
    parts.push(`${topSource.label} représente la principale source de trafic.`);
  }

  const topPage = pages[0];
  if (topPage?.title) {
    parts.push(
      `La page « ${topPage.title} » est la plus consultée (${formatNumber(topPage.views)} vues).`
    );
  }

  if (reservations > 0) {
    parts.push(`${formatNumber(reservations)} réservation${reservations > 1 ? "s" : ""} ont été terminées.`);
  } else {
    parts.push("Aucune réservation terminée n'a encore été enregistrée pour cette période.");
  }

  const conversion = safeConversionRate(reservations, sessions);
  if (sessions > 0 && reservations > 0) {
    parts.push(
      `Le taux de conversion réservation est d'environ ${conversion.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % (réservations terminées / sessions).`
    );
  }

  return parts.join(" ");
}
