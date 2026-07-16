import { validateGoogleReviewUrl } from "./validate-url";

/** @typedef {{ ok: true, url: string }} GoogleReviewRedirectReady */
/** @typedef {{ ok: false, reason: string }} GoogleReviewRedirectError */
/** @typedef {GoogleReviewRedirectReady | GoogleReviewRedirectError} GoogleReviewRedirectResult */

/**
 * Résout la destination Google depuis GOOGLE_REVIEW_URL (serveur uniquement).
 * @returns {GoogleReviewRedirectResult}
 */
export function getGoogleReviewRedirectTarget() {
  const raw = process.env.GOOGLE_REVIEW_URL?.trim();

  if (!raw) {
    return { ok: false, reason: "missing_env" };
  }

  const validation = validateGoogleReviewUrl(raw);
  if (!validation.valid) {
    return { ok: false, reason: validation.reason };
  }

  return { ok: true, url: validation.url };
}
