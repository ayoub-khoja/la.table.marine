import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CONSENT_COOKIE_NAME,
  CONSENT_VERSION,
} from "./consent-config";
import {
  createAcceptAllConsent,
  createRejectAllConsent,
  createConsentObject,
  isConsentExpired,
  isConsentValid,
  isConsentVersionValid,
  loadConsent,
  parseConsent,
  saveConsent,
  clearStoredConsent,
  canUseAnalytics,
} from "./consent-storage";

describe("consent-storage", () => {
  beforeEach(() => {
    document.cookie = `${CONSENT_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  afterEach(() => {
    document.cookie = `${CONSENT_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  it("retourne null si consentement absent", () => {
    expect(loadConsent()).toBeNull();
    expect(isConsentValid(null)).toBe(false);
  });

  it("valide un consentement accept-all", () => {
    const consent = createAcceptAllConsent();
    saveConsent(consent);
    const loaded = loadConsent();

    expect(loaded).not.toBeNull();
    expect(isConsentValid(loaded)).toBe(true);
    expect(loaded.analytics).toBe(true);
    expect(loaded.marketing).toBe(true);
    expect(loaded.externalMedia).toBe(true);
  });

  it("valide un consentement reject-all", () => {
    const consent = createRejectAllConsent();
    saveConsent(consent);
    const loaded = loadConsent();

    expect(isConsentValid(loaded)).toBe(true);
    expect(loaded.analytics).toBe(false);
    expect(canUseAnalytics(loaded)).toBe(false);
  });

  it("détecte un consentement expiré", () => {
    const expired = createRejectAllConsent();
    expired.expiresAt = new Date(Date.now() - 1000).toISOString();

    expect(isConsentExpired(expired)).toBe(true);
    expect(isConsentValid(expired)).toBe(false);
  });

  it("détecte une version obsolète", () => {
    const outdated = createRejectAllConsent();
    outdated.version = "0.9";

    expect(isConsentVersionValid(outdated)).toBe(false);
    expect(isConsentValid(outdated)).toBe(false);
  });

  it("sauvegarde les préférences personnalisées", () => {
    const consent = createConsentObject({
      analytics: true,
      marketing: false,
      externalMedia: false,
    });

    saveConsent(consent);
    const loaded = loadConsent();

    expect(loaded.analytics).toBe(true);
    expect(loaded.marketing).toBe(false);
    expect(loaded.externalMedia).toBe(false);
    expect(loaded.version).toBe(CONSENT_VERSION);
  });

  it("efface le consentement stocké", () => {
    saveConsent(createAcceptAllConsent());
    clearStoredConsent();
    expect(loadConsent()).toBeNull();
  });

  it("rejette un JSON invalide", () => {
    expect(parseConsent("not-json")).toBeNull();
    expect(parseConsent("{}")).toBeNull();
  });
});
