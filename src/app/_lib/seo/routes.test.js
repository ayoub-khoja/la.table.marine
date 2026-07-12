import { describe, expect, it } from "vitest";

import {
  INDEXABLE_STATIC_ROUTES,
  NOINDEX_PUBLIC_ROUTES,
  ROBOTS_DISALLOW_PREFIXES,
  isIndexableRoute,
} from "./routes";

describe("seo routes", () => {
  it("indexe les pages business principales", () => {
    expect(isIndexableRoute("/")).toBe(true);
    expect(isIndexableRoute("/contact")).toBe(true);
    expect(isIndexableRoute("/reservation")).toBe(true);
    expect(isIndexableRoute("/menu")).toBe(true);
  });

  it("exclut admin et API", () => {
    expect(isIndexableRoute("/admin")).toBe(false);
    expect(isIndexableRoute("/admin/dashboard")).toBe(false);
    expect(isIndexableRoute("/api/contact")).toBe(false);
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/admin");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/api");
  });

  it("noindex les variantes de démonstration", () => {
    for (const route of NOINDEX_PUBLIC_ROUTES) {
      expect(isIndexableRoute(route)).toBe(false);
    }
  });

  it("référence les routes statiques dans le sitemap", () => {
    const paths = INDEXABLE_STATIC_ROUTES.map((route) => route.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/about");
    expect(paths).not.toContain("/home-2");
  });
});
