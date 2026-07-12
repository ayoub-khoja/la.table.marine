/**
 * Google Consent Mode v2 — valeurs par défaut (denied pour analytics/ads).
 * Ce script doit s'exécuter AVANT tout chargement Google (Basic Consent Mode).
 *
 * Pour passer en Advanced Consent Mode plus tard :
 * - Charger gtag.js immédiatement avec consent default denied
 * - Envoyer des pings cookieless avant consentement
 * - Voir : https://developers.google.com/tag-platform/security/guides/consent
 */
export const GOOGLE_CONSENT_DEFAULT = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  functionality_storage: "granted",
  security_storage: "granted",
  personalization_storage: "denied",
};

/**
 * Script inline injecté dans le <head> via next/script beforeInteractive.
 * Définit dataLayer + gtag stub et le consentement par défaut.
 */
export const GOOGLE_CONSENT_DEFAULT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', ${JSON.stringify(GOOGLE_CONSENT_DEFAULT)});
`;

/**
 * @param {import('./consent-types').CookieConsent | null | undefined} consent
 * @returns {Record<string, string>}
 */
export function getGoogleConsentUpdate(consent) {
  const analyticsGranted = Boolean(consent?.analytics);
  const marketingGranted = Boolean(consent?.marketing);

  return {
    analytics_storage: analyticsGranted ? "granted" : "denied",
    ad_storage: marketingGranted ? "granted" : "denied",
    ad_user_data: marketingGranted ? "granted" : "denied",
    ad_personalization: marketingGranted ? "granted" : "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    personalization_storage: marketingGranted ? "granted" : "denied",
  };
}

/**
 * @param {import('./consent-types').CookieConsent | null | undefined} consent
 */
export function applyGoogleConsentUpdate(consent) {
  if (typeof window === "undefined") return;

  const gtag = window.gtag;
  if (typeof gtag !== "function") return;

  gtag("consent", "update", getGoogleConsentUpdate(consent));
}
