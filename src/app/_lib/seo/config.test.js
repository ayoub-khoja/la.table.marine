import { describe, expect, it } from "vitest";

import { absoluteUrl, SEO_CONFIG } from "./config";

describe("seo config", () => {
  it("utilise le domaine canonique https://latablemarine.com", () => {
    expect(SEO_CONFIG.siteUrl).toBe("https://latablemarine.com");
  });

  it("génère des URLs absolues cohérentes", () => {
    expect(absoluteUrl("/contact")).toBe("https://latablemarine.com/contact");
    expect(absoluteUrl("/")).toBe("https://latablemarine.com/");
  });

  it("expose les données NAP principales", () => {
    expect(SEO_CONFIG.telephoneDisplay).toBe("01 88 93 76 72");
    expect(SEO_CONFIG.email).toBe("contact@latablemarine.com");
    expect(SEO_CONFIG.address.postalCode).toBe("78370");
    expect(SEO_CONFIG.address.addressLocality).toBe("Plaisir");
  });

  it("définit des horaires d'ouverture", () => {
    expect(SEO_CONFIG.openingHours.length).toBeGreaterThan(0);
  });
});
