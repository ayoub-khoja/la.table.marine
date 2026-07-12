import { describe, expect, it } from "vitest";

import { parseGoogleApiErrorMessage } from "./ga4-error-parse";
import { normalizePropertyId, validateGa4Credentials } from "./ga4-config";

describe("ga4-error-parse", () => {
  it("détecte permission denied", () => {
    const msg = parseGoogleApiErrorMessage({
      code: 7,
      message: "PERMISSION_DENIED: User does not have sufficient permissions",
    });
    expect(msg).toContain("Gestion des accès");
  });

  it("détecte API non activée", () => {
    const msg = parseGoogleApiErrorMessage({
      message:
        "Google Analytics Data API has not been used in project 123 before or it is disabled",
    });
    expect(msg).toContain("Google Analytics Data API");
  });
});

describe("validateGa4Credentials", () => {
  const original = { ...process.env };

  it("rejette un property ID non numérique", () => {
    process.env.GA4_PROPERTY_ID = "G-CZ8VZEBR4G";
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "test@proj.iam.gserviceaccount.com";
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----";

    const result = validateGa4Credentials();
    expect(result.valid).toBe(false);
    expect(result.error).toContain("numéro");

    process.env = original;
  });

  it("normalise properties/ prefix", () => {
    expect(normalizePropertyId("properties/123456")).toBe("123456");
  });
});
