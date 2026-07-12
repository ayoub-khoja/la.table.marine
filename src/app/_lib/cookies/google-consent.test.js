import { describe, expect, it } from "vitest";

import {
  GOOGLE_CONSENT_DEFAULT,
  getGoogleConsentUpdate,
} from "./google-consent";

describe("google-consent", () => {
  it("définit denied par défaut pour analytics et ads", () => {
    expect(GOOGLE_CONSENT_DEFAULT.analytics_storage).toBe("denied");
    expect(GOOGLE_CONSENT_DEFAULT.ad_storage).toBe("denied");
    expect(GOOGLE_CONSENT_DEFAULT.ad_user_data).toBe("denied");
    expect(GOOGLE_CONSENT_DEFAULT.ad_personalization).toBe("denied");
    expect(GOOGLE_CONSENT_DEFAULT.functionality_storage).toBe("granted");
    expect(GOOGLE_CONSENT_DEFAULT.security_storage).toBe("granted");
  });

  it("accorde analytics_storage si analytics accepté", () => {
    const update = getGoogleConsentUpdate({
      analytics: true,
      marketing: false,
      externalMedia: false,
      necessary: true,
    });

    expect(update.analytics_storage).toBe("granted");
    expect(update.ad_storage).toBe("denied");
  });

  it("accorde ad_storage si marketing accepté", () => {
    const update = getGoogleConsentUpdate({
      analytics: false,
      marketing: true,
      externalMedia: false,
      necessary: true,
    });

    expect(update.ad_storage).toBe("granted");
    expect(update.ad_user_data).toBe("granted");
    expect(update.ad_personalization).toBe("granted");
    expect(update.analytics_storage).toBe("denied");
  });
});
