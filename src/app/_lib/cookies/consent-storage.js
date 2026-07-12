import {
  CONSENT_COOKIE_NAME,
  CONSENT_DURATION_MS,
  CONSENT_VERSION,
} from "./consent-config";

/**
 * @returns {boolean}
 */
function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * @returns {boolean}
 */
function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * @param {string} name
 * @returns {string | null}
 */
export function getCookieValue(name) {
  if (!isBrowser()) return null;

  const encodedName = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(";");

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(encodedName)) {
      return decodeURIComponent(trimmed.slice(encodedName.length));
    }
  }

  return null;
}

/**
 * @param {string} name
 * @param {string} value
 * @param {number} maxAgeSeconds
 */
export function setCookieValue(name, value, maxAgeSeconds) {
  if (!isBrowser()) return;

  const secure = isProduction() ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

/**
 * @param {string} name
 */
export function deleteCookieValue(name) {
  if (!isBrowser()) return;

  const secure = isProduction() ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

/**
 * @param {import('./consent-types').CookiePreferences} preferences
 * @returns {import('./consent-types').CookieConsent}
 */
export function createConsentObject(preferences) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CONSENT_DURATION_MS);

  return {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    externalMedia: Boolean(preferences.externalMedia),
    timestamp: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * @returns {import('./consent-types').CookieConsent}
 */
export function createAcceptAllConsent() {
  return createConsentObject({
    analytics: true,
    marketing: true,
    externalMedia: true,
  });
}

/**
 * @returns {import('./consent-types').CookieConsent}
 */
export function createRejectAllConsent() {
  return createConsentObject({
    analytics: false,
    marketing: false,
    externalMedia: false,
  });
}

/**
 * @param {unknown} value
 * @returns {import('./consent-types').CookieConsent | null}
 */
export function parseConsent(value) {
  if (!value || typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.version !== "string" ||
      typeof parsed.necessary !== "boolean" ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean" ||
      typeof parsed.externalMedia !== "boolean" ||
      typeof parsed.timestamp !== "string" ||
      typeof parsed.expiresAt !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {import('./consent-types').CookieConsent | null | undefined} consent
 * @returns {boolean}
 */
export function isConsentExpired(consent) {
  if (!consent?.expiresAt) return true;

  const expiresAt = new Date(consent.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) return true;

  return Date.now() >= expiresAt.getTime();
}

/**
 * @param {import('./consent-types').CookieConsent | null | undefined} consent
 * @returns {boolean}
 */
export function isConsentVersionValid(consent) {
  return consent?.version === CONSENT_VERSION;
}

/**
 * @param {import('./consent-types').CookieConsent | null | undefined} consent
 * @returns {boolean}
 */
export function isConsentValid(consent) {
  if (!consent) return false;
  if (!isConsentVersionValid(consent)) return false;
  if (isConsentExpired(consent)) return false;
  return true;
}

/**
 * @returns {import('./consent-types').CookieConsent | null}
 */
export function loadConsent() {
  const raw = getCookieValue(CONSENT_COOKIE_NAME);
  const consent = parseConsent(raw);

  if (!isConsentValid(consent)) {
    return null;
  }

  return consent;
}

/**
 * @param {import('./consent-types').CookieConsent} consent
 */
export function saveConsent(consent) {
  const maxAgeSeconds = Math.floor(CONSENT_DURATION_MS / 1000);
  setCookieValue(CONSENT_COOKIE_NAME, JSON.stringify(consent), maxAgeSeconds);
}

/**
 * @returns {import('./consent-types').CookiePreferences}
 */
export function getDefaultPreferences() {
  return {
    analytics: false,
    marketing: false,
    externalMedia: false,
  };
}

/**
 * @param {import('./consent-types').CookieConsent | null | undefined} consent
 * @returns {import('./consent-types').CookiePreferences}
 */
export function consentToPreferences(consent) {
  if (!consent) return getDefaultPreferences();

  return {
    analytics: consent.analytics,
    marketing: consent.marketing,
    externalMedia: consent.externalMedia,
  };
}

/**
 * @param {import('./consent-types').CookieConsent | null | undefined} consent
 * @returns {boolean}
 */
export function canUseAnalytics(consent) {
  return Boolean(consent?.analytics);
}

/**
 * @param {import('./consent-types').CookieConsent | null | undefined} consent
 * @returns {boolean}
 */
export function canUseMarketing(consent) {
  return Boolean(consent?.marketing);
}

/**
 * @param {import('./consent-types').CookieConsent | null | undefined} consent
 * @returns {boolean}
 */
export function canUseExternalMedia(consent) {
  return Boolean(consent?.externalMedia);
}

/**
 */
export function clearStoredConsent() {
  deleteCookieValue(CONSENT_COOKIE_NAME);
}
