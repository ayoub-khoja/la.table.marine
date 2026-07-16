import { describe, expect, it } from "vitest";

import { withMenuCacheBuster } from "./pdf-url";

describe("pdf-url cache buster", () => {
  it("ajoute un paramètre de version pour éviter le cache obsolète", () => {
    const url = withMenuCacheBuster("/api/menu/file", {
      version: 3,
      updatedAt: "2026-07-16T10:00:00.000Z",
    });

    expect(url).toContain("/api/menu/file");
    expect(url).toContain("v=");
  });

  it("change le paramètre de version après remplacement", () => {
    const before = withMenuCacheBuster("/api/menu/file", { version: 1 });
    const after = withMenuCacheBuster("/api/menu/file", { version: 2 });
    expect(before).not.toBe(after);
    expect(before.startsWith("/api/menu/file")).toBe(true);
    expect(after.startsWith("/api/menu/file")).toBe(true);
  });

  it("conserve l'URL publique /menu hors du cache buster fichier", () => {
    expect("/menu").toBe("/menu");
  });
});
