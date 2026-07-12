import { describe, expect, it } from "vitest";

import { buildUtmUrl } from "./utm-builder";

describe("utm-builder", () => {
  it("génère une URL UTM valide", () => {
    const result = buildUtmUrl("https://latablemarine.com/reservation", {
      source: "instagram",
      medium: "social",
      campaign: "lancement_juillet",
      content: "story1",
    });

    expect(result.error).toBeNull();
    expect(result.url).toContain("utm_source=instagram");
    expect(result.url).toContain("utm_medium=social");
    expect(result.url).toContain("utm_campaign=lancement_juillet");
    expect(result.url).toContain("utm_content=story1");
  });

  it("rejette une URL invalide", () => {
    const result = buildUtmUrl("pas-une-url", {
      source: "instagram",
      medium: "social",
      campaign: "test",
    });
    expect(result.url).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it("exige source, medium et campagne", () => {
    const result = buildUtmUrl("https://latablemarine.com", {
      source: "instagram",
    });
    expect(result.url).toBeNull();
    expect(result.error).toContain("obligatoires");
  });
});
