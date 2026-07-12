import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getGa4Config, getGa4PrivateKey } from "./ga4-config";

describe("ga4-config", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = original;
  });

  it("détecte une configuration absente", () => {
    delete process.env.GA4_PROPERTY_ID;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    const config = getGa4Config();
    expect(config.isConfigured).toBe(false);
    expect(config.message).toContain("pas configuré");
  });

  it("valide une configuration complète", () => {
    process.env.GA4_PROPERTY_ID = "123456789";
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "test@project.iam.gserviceaccount.com";
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----";

    const config = getGa4Config();
    expect(config.isConfigured).toBe(true);
    expect(config.propertyId).toBe("123456789");
  });

  it("convertit les retours à la ligne \\n de la clé privée", () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY =
      "-----BEGIN PRIVATE KEY-----\\nline1\\nline2\\n-----END PRIVATE KEY-----";

    const key = getGa4PrivateKey();
    expect(key).toContain("\nline1\n");
    expect(key).not.toContain("\\n");
  });
});
