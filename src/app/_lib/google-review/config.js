import { validateGoogleReviewUrl } from "./validate-url";

/** @typedef {{ ok: true, url: string }} GoogleReviewRedirectReady */
/** @typedef {{ ok: false, reason: string }} GoogleReviewRedirectError */
/** @typedef {GoogleReviewRedirectReady | GoogleReviewRedirectError} GoogleReviewRedirectResult */

/**
 * Résout la destination Google depuis GOOGLE_REVIEW_URL (serveur uniquement).
 * @returns {GoogleReviewRedirectResult}
 */
export function getGoogleReviewRedirectTarget() {
  let raw = process.env.GOOGLE_REVIEW_URL?.trim();

  if (!raw) {
    return { ok: false, reason: "missing_env" };
  }

  // Enlève les guillemets éventuels (.env avec # dans l'URL)
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim();
  }

  const validation = validateGoogleReviewUrl(raw);
  if (!validation.valid) {
    return { ok: false, reason: validation.reason };
  }

  return { ok: true, url: validation.url };
}
