import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getGaMeasurementId,
  isGaConfigured,
  trackEvent,
} from "./analytics";
import { createAcceptAllConsent, saveConsent, clearStoredConsent } from "./consent-storage";

describe("analytics", () => {
  const originalEnv = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  beforeEach(() => {
    clearStoredConsent();
    window.gtag = vi.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = originalEnv;
    clearStoredConsent();
    delete window.gtag;
  });

  it("retourne null si GA4 non configuré", () => {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    expect(getGaMeasurementId()).toBeNull();
    expect(isGaConfigured()).toBe(false);
  });

  it("ne déclenche pas trackEvent sans consentement analytics", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST123";
    saveConsent(createAcceptAllConsent());
    const consent = createAcceptAllConsent();
    consent.analytics = false;
    saveConsent(consent);

    trackEvent({ name: "reservation_started", params: { source: "homepage" } });

    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("déclenche trackEvent avec consentement analytics", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST123";
    saveConsent(createAcceptAllConsent());

    trackEvent({ name: "reservation_started", params: { source: "homepage" } });

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "reservation_started",
      expect.objectContaining({ source: "homepage", send_to: "G-TEST123" })
    );
  });

  it("filtre les données personnelles des paramètres", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST123";
    saveConsent(createAcceptAllConsent());

    trackEvent({
      name: "contact_form_submitted",
      params: { email: "test@example.com", source: "contact" },
    });

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "contact_form_submitted",
      expect.not.objectContaining({ email: expect.anything() })
    );
  });
});
