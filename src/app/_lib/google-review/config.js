import { validateGoogleReviewUrl } from "./validate-url";

/** @typedef {{ ok: true, url: string }} GoogleReviewRedirectReady */
/** @typedef {{ ok: false, reason: string }} GoogleReviewRedirectError */
/** @typedef {GoogleReviewRedirectReady | GoogleReviewRedirectError} GoogleReviewRedirectResult */

/**
 * Ancienne URL writereview + placeid hex → 404 Google.
 * Remplacée par le lien Search qui ouvre la fenêtre d'avis.
 */
const BROKEN_WRITEREVIEW_HEX =
  /search\.google\.com\/local\/writereview\?placeid=0x47e685d4a2e5dfbf:?0xce3373429cba3caa/i;

const WORKING_GOOGLE_REVIEW_URL =
  "https://www.google.com/search?q=La+Table+Marine+Plaisir&ludocid=14858346325559884970#lrd=0x47e685d4a2e5dfbf:0xce3373429cba3caa,3";

/**
 * @param {string} raw
 */
function stripQuotes(raw) {
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

/**
 * Corrige les anciennes URLs Google invalides (404 /local/writereview).
 * @param {string} url
 */
export function normalizeGoogleReviewUrl(url) {
  const trimmed = stripQuotes(url.trim());
  if (BROKEN_WRITEREVIEW_HEX.test(trimmed)) {
    return WORKING_GOOGLE_REVIEW_URL;
  }
  return trimmed;
}

/**
 * Résout la destination Google depuis GOOGLE_REVIEW_URL (serveur uniquement).
 * @returns {GoogleReviewRedirectResult}
 */
export function getGoogleReviewRedirectTarget() {
  const envRaw = process.env.GOOGLE_REVIEW_URL?.trim();

  if (!envRaw) {
    return { ok: false, reason: "missing_env" };
  }

  const raw = normalizeGoogleReviewUrl(envRaw);
  const validation = validateGoogleReviewUrl(raw);
  if (!validation.valid) {
    return { ok: false, reason: validation.reason };
  }

  return { ok: true, url: validation.url };
}

export { WORKING_GOOGLE_REVIEW_URL };
