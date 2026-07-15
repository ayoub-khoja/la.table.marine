import { describe, expect, it } from "vitest";

import {
  buildHomeSchemas,
  buildRestaurantSchema,
  buildRestaurantVideoObjectSchema,
  buildSecondaryPageSchemas,
  serializeJsonLd,
} from "./json-ld";

describe("seo json-ld", () => {
  it("sérialise sans balise script injectable", () => {
    const payload = serializeJsonLd({ test: "<script>alert(1)</script>" });
    expect(payload).not.toContain("<script>");
    expect(payload).toContain("\\u003c");
  });

  it("construit un schéma Restaurant sans aggregateRating", () => {
    const schema = buildRestaurantSchema();
    expect(schema["@type"]).toBe("Restaurant");
    expect(schema.name).toBe("La Table Marine");
    expect(schema.menu).toBeUndefined();
    expect(schema.hasMenu).toBeUndefined();
    expect(schema.aggregateRating).toBeUndefined();
    expect(schema.review).toBeUndefined();
  });

  it("inclut les schémas attendus pour l'accueil", () => {
    const schemas = buildHomeSchemas();
    const types = schemas.map((item) => item["@type"]);
    expect(types).toContain("Restaurant");
    expect(types).toContain("Organization");
    expect(types).toContain("WebSite");
    expect(types).toContain("WebPage");
    expect(types).toContain("VideoObject");
  });

  it("construit un VideoObject pour la vidéo du restaurant", () => {
    const schema = buildRestaurantVideoObjectSchema();
    expect(schema["@type"]).toBe("VideoObject");
    expect(schema.contentUrl).toMatch(/^https:\/\//);
    expect(schema.thumbnailUrl).toMatch(/^https:\/\//);
    expect(schema.duration).toMatch(/^PT\d+S$/);
  });

  it("inclut le schéma Restaurant sur /commande-en-ligne", () => {
    const schemas = buildSecondaryPageSchemas({
      path: "/commande-en-ligne",
      title: "Commande en ligne",
      description: "Commandez en ligne à Plaisir.",
      breadcrumbs: [
        { name: "Accueil", path: "/" },
        { name: "Commande en ligne", path: "/commande-en-ligne" },
      ],
    });

    const types = schemas.map((item) => item["@type"]);
    expect(types).toContain("Restaurant");
    expect(types).toContain("WebPage");
    expect(types).toContain("BreadcrumbList");
  });
});
