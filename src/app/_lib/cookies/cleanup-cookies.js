import { deleteCookieValue } from "./consent-storage";

const ANALYTICS_COOKIE_PREFIXES = ["_ga", "_gid", "_gat"];
const MARKETING_COOKIE_PREFIXES = ["_fbp", "_fbc", "_gcl"];

/**
 * @param {string} cookieName
 * @param {string[]} prefixes
 * @returns {boolean}
 */
function matchesPrefixes(cookieName, prefixes) {
  return prefixes.some(
    (prefix) => cookieName === prefix || cookieName.startsWith(`${prefix}_`)
  );
}

/**
 * @param {string[]} prefixes
 */
export function removeCookiesByPrefixes(prefixes) {
  if (typeof document === "undefined") return;

  const cookies = document.cookie.split(";").map((part) => part.trim().split("=")[0]);

  for (const rawName of cookies) {
    const name = decodeURIComponent(rawName);
    if (!name) continue;

    if (matchesPrefixes(name, prefixes)) {
      deleteCookieValue(name);

      const hostname = window.location.hostname;
      const parts = hostname.split(".");
      const domains = [hostname, `.${hostname}`];

      if (parts.length > 2) {
        const parentDomain = parts.slice(-2).join(".");
        domains.push(parentDomain, `.${parentDomain}`);
      }

      for (const domain of domains) {
        document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax; Domain=${domain}`;
      }
    }
  }
}

/**
 */
export function removeAnalyticsCookies() {
  removeCookiesByPrefixes(ANALYTICS_COOKIE_PREFIXES);
}

/**
 */
export function removeMarketingCookies() {
  removeCookiesByPrefixes(MARKETING_COOKIE_PREFIXES);
}

/**
 * @param {import('./consent-types').CookieConsent} consent
 */
export function cleanupCookiesForConsent(consent) {
  if (!consent.analytics) {
    removeAnalyticsCookies();
  }

  if (!consent.marketing) {
    removeMarketingCookies();
  }
}
