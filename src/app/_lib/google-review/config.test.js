import { afterEach, describe, expect, it } from "vitest";

import {
  WORKING_GOOGLE_REVIEW_URL,
  getGoogleReviewRedirectTarget,
  normalizeGoogleReviewUrl,
} from "./config";

const ORIGINAL_GOOGLE = process.env.GOOGLE_REVIEW_URL;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

afterEach(() => {
  if (ORIGINAL_GOOGLE === undefined) delete process.env.GOOGLE_REVIEW_URL;
  else process.env.GOOGLE_REVIEW_URL = ORIGINAL_GOOGLE;
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

describe("getGoogleReviewRedirectTarget", () => {
  it("retourne l'URL Google configurée", () => {
    process.env.GOOGLE_REVIEW_URL =
      "https://search.google.com/local/writereview?placeid=ChIJTEST";
    const target = getGoogleReviewRedirectTarget();
    expect(target.ok).toBe(true);
    if (target.ok) {
      expect(target.url).toContain("search.google.com");
    }
  });

  it("échoue si GOOGLE_REVIEW_URL est absente", () => {
    delete process.env.GOOGLE_REVIEW_URL;
    const target = getGoogleReviewRedirectTarget();
    expect(target.ok).toBe(false);
    if (!target.ok) {
      expect(target.reason).toBe("missing_env");
    }
  });

  it("échoue si GOOGLE_REVIEW_URL est invalide", () => {
    process.env.GOOGLE_REVIEW_URL = "https://example.com/review";
    const target = getGoogleReviewRedirectTarget();
    expect(target.ok).toBe(false);
  });

  it("corrige l'ancienne URL writereview hex qui provoque un 404 Google", () => {
    process.env.GOOGLE_REVIEW_URL =
      "https://search.google.com/local/writereview?placeid=0x47e685d4a2e5dfbf:0xce3373429cba3caa";
    const target = getGoogleReviewRedirectTarget();
    expect(target.ok).toBe(true);
    if (target.ok) {
      expect(target.url).toBe(WORKING_GOOGLE_REVIEW_URL);
      expect(target.url).toContain("placeid=ChIJ");
      expect(target.url).toContain("/local/writereview");
      expect(target.url).not.toContain("#");
    }
  });

  it("remplace le lien Search+#lrd (fragile sur mobile) par writereview Place ID", () => {
    process.env.GOOGLE_REVIEW_URL =
      "https://www.google.com/search?q=La+Table+Marine+Plaisir&ludocid=14858346325559884970#lrd=0x47e685d4a2e5dfbf:0xce3373429cba3caa,3";
    const target = getGoogleReviewRedirectTarget();
    expect(target.ok).toBe(true);
    if (target.ok) {
      expect(target.url).toBe(WORKING_GOOGLE_REVIEW_URL);
      expect(target.url).not.toContain("#lrd");
    }
  });
});

describe("normalizeGoogleReviewUrl", () => {
  it("laisse intacte l'URL writereview Place ID", () => {
    expect(normalizeGoogleReviewUrl(WORKING_GOOGLE_REVIEW_URL)).toBe(
      WORKING_GOOGLE_REVIEW_URL
    );
  });
});
