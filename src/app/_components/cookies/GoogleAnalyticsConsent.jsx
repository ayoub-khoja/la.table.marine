/**
 * Google Analytics 4 — Basic Consent Mode
 *
 * Le chargement de GA4 est géré par CookieConsentProvider via :
 * - applyGoogleConsentUpdate() avant/après choix utilisateur
 * - loadGoogleAnalyticsScript() uniquement si analytics consent = true
 * - unloadGoogleAnalytics() lors du retrait du consentement
 *
 * Pour passer en Advanced Consent Mode :
 * 1. Charger gtag.js immédiatement (beforeInteractive) avec consent default denied
 * 2. Conserver applyGoogleConsentUpdate() pour les mises à jour post-consentement
 * 3. Activer les pings cookieless selon la documentation Google Tag Platform
 * 4. Retirer le garde-fou loadGoogleAnalyticsScript() conditionnel ou l'adapter
 *
 * @see src/app/_lib/cookies/analytics.js
 * @see src/app/_lib/cookies/google-consent.js
 */

export {};
