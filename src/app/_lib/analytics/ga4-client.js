import { BetaAnalyticsDataClient } from "@google-analytics/data";

import {
  getGa4Config,
  getGa4PrivateKey,
  getGa4ServiceAccountEmail,
  normalizePropertyId,
  validateGa4Credentials,
  GA4_REQUEST_TIMEOUT_MS,
} from "./ga4-config";
import { Ga4ConfigError } from "./ga4-errors";

/** @type {BetaAnalyticsDataClient | null} */
let cachedClient = null;

/**
 * @returns {BetaAnalyticsDataClient}
 */
export function getGa4Client() {
  const config = getGa4Config();
  if (!config.isConfigured) {
    throw new Ga4ConfigError(config.message);
  }

  if (!cachedClient) {
    const email = getGa4ServiceAccountEmail();
    const privateKey = getGa4PrivateKey();
    const validation = validateGa4Credentials();

    if (!email || !privateKey) {
      throw new Ga4ConfigError(
        "Identifiants du compte de service Google Analytics manquants."
      );
    }

    if (!validation.valid) {
      throw new Ga4ConfigError(validation.error || "Configuration GA4 invalide.");
    }

    cachedClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: email,
        private_key: privateKey,
      },
    });
  }

  return cachedClient;
}

/**
 * @returns {string}
 */
export function getGa4PropertyName() {
  const config = getGa4Config();
  if (!config.propertyId) {
    throw new Ga4ConfigError(config.message);
  }
  return `properties/${normalizePropertyId(config.propertyId)}`;
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export function withGa4Timeout(fn) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("GA4 request timeout"));
      }, GA4_REQUEST_TIMEOUT_MS);
    }),
  ]);
}

/**
 */
export function resetGa4ClientForTests() {
  cachedClient = null;
}
