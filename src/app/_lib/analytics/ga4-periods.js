import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfYear,
  subDays,
} from "date-fns";

import { GA4_MAX_PERIOD_DAYS } from "./ga4-config";
import { Ga4ValidationError } from "./ga4-errors";

export const RANGE_PRESETS = {
  today: "today",
  yesterday: "yesterday",
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
  year: "year",
  custom: "custom",
};

/**
 * @typedef {Object} AnalyticsPeriod
 * @property {string} range
 * @property {string} startDate - YYYY-MM-DD
 * @property {string} endDate - YYYY-MM-DD
 * @property {string} compareStartDate
 * @property {string} compareEndDate
 * @property {number} days
 * @property {boolean} hourly
 */

/**
 * @param {Date} date
 * @returns {string}
 */
export function toGa4Date(date) {
  return format(date, "yyyy-MM-dd");
}

/**
 * @param {string} value
 * @returns {Date | null}
 */
function parseDateParam(value) {
  if (!value || typeof value !== "string") return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

/**
 * @param {string} range
 * @param {{ start?: string | null, end?: string | null }} [custom]
 * @returns {AnalyticsPeriod}
 */
export function buildPeriod(range, custom = {}) {
  const preset = RANGE_PRESETS[range] ? range : "30d";
  const today = startOfDay(new Date());

  let start;
  let end;
  let hourly = false;

  switch (preset) {
    case "today":
      start = today;
      end = today;
      hourly = true;
      break;
    case "yesterday": {
      const y = subDays(today, 1);
      start = y;
      end = y;
      break;
    }
    case "7d":
      start = subDays(today, 6);
      end = today;
      break;
    case "30d":
      start = subDays(today, 29);
      end = today;
      break;
    case "90d":
      start = subDays(today, 89);
      end = today;
      break;
    case "year":
      start = startOfYear(today);
      end = today;
      break;
    case "custom": {
      const customStart = parseDateParam(custom.start || "");
      const customEnd = parseDateParam(custom.end || "");
      if (!customStart || !customEnd) {
        throw new Ga4ValidationError(
          "Période personnalisée invalide. Utilisez des dates au format AAAA-MM-JJ."
        );
      }
      if (customStart > customEnd) {
        throw new Ga4ValidationError(
          "La date de début doit être antérieure ou égale à la date de fin."
        );
      }
      start = customStart;
      end = customEnd;
      break;
    }
    default:
      start = subDays(today, 29);
      end = today;
  }

  const days = differenceInCalendarDays(endOfDay(end), startOfDay(start)) + 1;
  if (days > GA4_MAX_PERIOD_DAYS) {
    throw new Ga4ValidationError(
      `La période ne peut pas dépasser ${GA4_MAX_PERIOD_DAYS} jours.`
    );
  }

  const compareEnd = subDays(start, 1);
  const compareStart = subDays(compareEnd, days - 1);

  return {
    range: preset,
    startDate: toGa4Date(start),
    endDate: toGa4Date(end),
    compareStartDate: toGa4Date(compareStart),
    compareEndDate: toGa4Date(compareEnd),
    days,
    hourly,
  };
}

/**
 * @param {URLSearchParams} searchParams
 * @returns {{ period: AnalyticsPeriod, refresh: boolean }}
 */
export function parsePeriodFromSearchParams(searchParams) {
  const range = searchParams.get("range") || "30d";
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const refresh = searchParams.get("refresh") === "1";

  const period = buildPeriod(range, { start, end });
  return { period, refresh };
}

/**
 * @param {number | null | undefined} current
 * @param {number | null | undefined} previous
 * @returns {{ percent: number | null, direction: 'up' | 'down' | 'stable' | 'neutral', label: string }}
 */
export function computeEvolution(current, previous) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;

  if (prev === 0 && cur === 0) {
    return { percent: 0, direction: "stable", label: "Stable" };
  }

  if (prev === 0) {
    return { percent: null, direction: "neutral", label: "Nouveau" };
  }

  const percent = ((cur - prev) / prev) * 100;
  const rounded = Math.round(percent * 10) / 10;

  if (Math.abs(rounded) < 0.05) {
    return { percent: 0, direction: "stable", label: "Stable" };
  }

  if (rounded > 0) {
    return { percent: rounded, direction: "up", label: "Hausse" };
  }

  return { percent: rounded, direction: "down", label: "Baisse" };
}

/**
 * @param {number} value
 * @param {number} total
 * @returns {number}
 */
export function safeConversionRate(value, total) {
  const v = Number(value) || 0;
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  return Math.round((v / t) * 1000) / 10;
}
