import { describe, expect, it } from "vitest";

import {
  normalizeDeviceLabel,
  normalizeTrafficSource,
} from "./ga4-mappers";

describe("ga4-mappers", () => {
  it("normalise les sources de trafic", () => {
    expect(normalizeTrafficSource("google", "cpc")).toBe("Google");
    expect(normalizeTrafficSource("instagram", "social")).toBe("Instagram");
    expect(normalizeTrafficSource("facebook", "social")).toBe("Facebook");
    expect(normalizeTrafficSource("(direct)", "(none)")).toBe("Accès direct");
    expect(normalizeTrafficSource("newsletter", "email")).toBe("Autres");
  });

  it("normalise les appareils", () => {
    expect(normalizeDeviceLabel("mobile")).toBe("Mobile");
    expect(normalizeDeviceLabel("desktop")).toBe("Ordinateur");
    expect(normalizeDeviceLabel("tablet")).toBe("Tablette");
  });
});
