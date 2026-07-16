import { ALLOWED_GOOGLE_REVIEW_HOSTS } from "./constants";

/** @typedef {{ valid: true, url: string }} ValidGoogleReviewUrl */
/** @typedef {{ valid: false, reason: string }} InvalidGoogleReviewUrl */
/** @typedef {ValidGoogleReviewUrl | InvalidGoogleReviewUrl} GoogleReviewUrlValidation */

const FORBIDDEN_PROTOCOLS = new Set(["javascript:", "data:", "file:"]);

/**
 * @param {string} hostname
 */
export function isAllowedGoogleReviewHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (ALLOWED_GOOGLE_REVIEW_HOSTS.includes(host)) {
    return true;
  }

  if (host.endsWith(".google.com") || host.endsWith(".google.fr")) {
    return true;
  }

  if (host === "g.page" || host.endsWith(".g.page")) {
    return true;
  }

  return false;
}

/**
 * Valide strictement l'URL Google de destination avant redirection.
 * @param {string | undefined | null} rawUrl
 * @param {{ requireHttps?: boolean }} [options]
 * @returns {GoogleReviewUrlValidation}
 */
export function validateGoogleReviewUrl(rawUrl, options = {}) {
  const requireHttps =
    options.requireHttps ?? process.env.NODE_ENV === "production";

  if (rawUrl == null || typeof rawUrl !== "string") {
    return { valid: false, reason: "missing" };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, reason: "empty" };
  }

  if (/^\/[^/]/.test(trimmed) || trimmed.startsWith("//")) {
    return { valid: false, reason: "relative" };
  }

  /** @type {URL} */
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: "malformed" };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (FORBIDDEN_PROTOCOLS.has(protocol)) {
    return { valid: false, reason: "forbidden_protocol" };
  }

  if (requireHttps && protocol !== "https:") {
    return { valid: false, reason: "https_required" };
  }

  if (protocol !== "https:" && protocol !== "http:") {
    return { valid: false, reason: "invalid_protocol" };
  }

  if (!isAllowedGoogleReviewHost(parsed.hostname)) {
    return { valid: false, reason: "domain_not_allowed" };
  }

  return { valid: true, url: parsed.toString() };
}
