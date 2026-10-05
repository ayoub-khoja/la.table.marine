import { afterEach, describe, expect, it } from "vitest";

import {
  isAllowedGoogleReviewHost,
  validateGoogleReviewUrl,
} from "./validate-url";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

describe("validateGoogleReviewUrl", () => {
  const validGoogleUrl =
    "https://search.google.com/local/writereview?placeid=ChIJTEST";

  it("accepte une URL Google HTTPS valide", () => {
    const result = validateGoogleReviewUrl(validGoogleUrl, {
      requireHttps: true,
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.url).toBe(validGoogleUrl);
    }
  });

  it("accepte les sous-domaines officiels google.com", () => {
    expect(
      isAllowedGoogleReviewHost("accounts.google.com")
    ).toBe(true);
    expect(
      validateGoogleReviewUrl("https://maps.google.com/maps?cid=123", {
        requireHttps: true,
      }).valid
    ).toBe(true);
  });

  it("accepte maps.app.goo.gl, g.page et google.fr", () => {
    expect(
      validateGoogleReviewUrl("https://maps.app.goo.gl/abc", {
        requireHttps: true,
      }).valid
    ).toBe(true);
    expect(
      validateGoogleReviewUrl("https://g.page/r/abc/review", {
        requireHttps: true,
      }).valid
    ).toBe(true);
    expect(
      validateGoogleReviewUrl(
        "https://www.google.fr/search?q=La+Table+Marine+Plaisir",
        { requireHttps: true }
      ).valid
    ).toBe(true);
  });

  it("refuse javascript:", () => {
    const result = validateGoogleReviewUrl("javascript:alert(1)", {
      requireHttps: false,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("forbidden_protocol");
    }
  });

  it("refuse data: et file:", () => {
    expect(
      validateGoogleReviewUrl("data:text/html,test", { requireHttps: false })
        .valid
    ).toBe(false);
    expect(
      validateGoogleReviewUrl("file:///etc/passwd", { requireHttps: false })
        .valid
    ).toBe(false);
  });

  it("refuse les URLs relatives", () => {
    expect(validateGoogleReviewUrl("/local/writereview").valid).toBe(false);
    expect(validateGoogleReviewUrl("//evil.com/path").valid).toBe(false);
  });

  it("refuse les URLs mal formées", () => {
    expect(validateGoogleReviewUrl("not-a-url").valid).toBe(false);
  });

  it("refuse un domaine non Google", () => {
    const result = validateGoogleReviewUrl("https://evil.com/review", {
      requireHttps: true,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("domain_not_allowed");
    }
  });

  it("refuse HTTP en production", () => {
    process.env.NODE_ENV = "production";
    const result = validateGoogleReviewUrl(
      "http://search.google.com/local/writereview?placeid=TEST"
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("https_required");
    }
  });

  it("autorise HTTP hors production pour le développement local", () => {
    process.env.NODE_ENV = "development";
    const result = validateGoogleReviewUrl(
      "http://search.google.com/local/writereview?placeid=TEST"
    );
    expect(result.valid).toBe(true);
  });
});
