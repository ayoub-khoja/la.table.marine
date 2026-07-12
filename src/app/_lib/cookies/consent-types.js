/**
 * @typedef {Object} CookieConsent
 * @property {string} version - Version de la politique de cookies
 * @property {boolean} necessary - Toujours true
 * @property {boolean} analytics - Mesure d'audience (GA4)
 * @property {boolean} marketing - Publicité / remarketing
 * @property {boolean} externalMedia - Contenus tiers (Maps, YouTube, etc.)
 * @property {string} timestamp - Date ISO du choix
 * @property {string} expiresAt - Date ISO d'expiration
 */

/**
 * @typedef {Object} CookiePreferences
 * @property {boolean} analytics
 * @property {boolean} marketing
 * @property {boolean} externalMedia
 */

/**
 * @typedef {Object} CookieCategoryDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {boolean} required
 * @property {boolean} defaultEnabled
 */

/**
 * @typedef {Object} CookieServiceDetail
 * @property {string} name
 * @property {string} purpose
 * @property {string} provider
 * @property {string} duration
 * @property {string} categoryId
 */

/**
 * @typedef {Object} AnalyticsEventParams
 * @property {string} [source]
 * @property {string} [page_path]
 * @property {string} [page_title]
 * @property {string} [page_location]
 */

/**
 * @typedef {Object} TrackEventInput
 * @property {string} name
 * @property {AnalyticsEventParams} [params]
 */

export {};
