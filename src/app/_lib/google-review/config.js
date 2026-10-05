import { validateGoogleReviewUrl } from "./validate-url";

/** @typedef {{ ok: true, url: string }} GoogleReviewRedirectReady */
/** @typedef {{ ok: false, reason: string }} GoogleReviewRedirectError */
/** @typedef {GoogleReviewRedirectReady | GoogleReviewRedirectError} GoogleReviewRedirectResult */

/**
 * Place ID Google Maps (ChIJ…) — requis pour /local/writereview.
 * Fonctionne sur mobile au scan QR (contrairement au lien Search + #lrd).
 */
export const GOOGLE_REVIEW_PLACE_ID = "ChIJv9_lotSF5kcRqjy6nEJzM84";

/**
 * URL d'écriture d'avis sans fragment (#).
 * Les redirections HTTP et l'app Google mobile conservent cette URL intacte.
 */
const WORKING_GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${GOOGLE_REVIEW_PLACE_ID}`;

/** Ancienne URL writereview + placeid hex → 404 Google. */
const BROKEN_WRITEREVIEW_HEX =
  /search\.google\.com\/local\/writereview\?placeid=0x47e685d4a2e5dfbf:?0xce3373429cba3caa/i;

/** Ancien lien Search + #lrd : OK desktop, souvent cassé sur mobile (app Google). */
const LEGACY_SEARCH_LRD =
  /google\.[^/]+\/search\?.*ludocid=14858346325559884970/i;

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
 * Corrige les anciennes URLs Google (404 hex, ou Search+#lrd fragile sur mobile).
 * @param {string} url
 */
export function normalizeGoogleReviewUrl(url) {
  const trimmed = stripQuotes(url.trim());
  if (BROKEN_WRITEREVIEW_HEX.test(trimmed) || LEGACY_SEARCH_LRD.test(trimmed)) {
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
