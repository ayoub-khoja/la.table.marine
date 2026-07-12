import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { removeAnalyticsCookies } from "./cleanup-cookies";
import { CONSENT_COOKIE_NAME } from "./consent-config";
import { saveConsent, createAcceptAllConsent } from "./consent-storage";

describe("cleanup-cookies", () => {
  beforeEach(() => {
    document.cookie = "_ga=test; Path=/";
    document.cookie = "_ga_ABC123=session; Path=/";
    document.cookie = CONSENT_COOKIE_NAME + "=needed; Path=/";
  });

  afterEach(() => {
    document.cookie = "_ga=; Path=/; Max-Age=0";
    document.cookie = "_ga_ABC123=; Path=/; Max-Age=0";
    document.cookie = CONSENT_COOKIE_NAME + "=; Path=/; Max-Age=0";
  });

  it("removes analytics cookies but keeps consent cookie", () => {
    removeAnalyticsCookies();

    expect(document.cookie.includes("_ga=")).toBe(false);
    expect(document.cookie.includes("_ga_ABC123=")).toBe(false);
    expect(document.cookie.includes(CONSENT_COOKIE_NAME + "=")).toBe(true);
  });

  it("stores analytics refusal after preference update", () => {
    const consent = createAcceptAllConsent();
    consent.analytics = false;
    saveConsent(consent);

    const raw = document.cookie
      .split(";")
      .find((part) => part.trim().startsWith(CONSENT_COOKIE_NAME + "="));

    expect(raw).toBeTruthy();
    const value = decodeURIComponent(raw.split("=")[1]);
    const parsed = JSON.parse(value);
    expect(parsed.analytics).toBe(false);
  });
});
