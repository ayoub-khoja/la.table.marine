import { afterEach, describe, expect, it } from "vitest";

import { getPermanentMenuUrl, getSiteUrl, PERMANENT_MENU_PATH } from "./public-url";

const ORIGINAL_SITE = process.env.SITE_URL;
const ORIGINAL_PUBLIC = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL_SITE === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = ORIGINAL_SITE;

  if (ORIGINAL_PUBLIC === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_PUBLIC;
});

describe("public-url menu", () => {
  it("expose le chemin permanent /menu", () => {
    expect(PERMANENT_MENU_PATH).toBe("/menu");
  });

  it("construit l'URL permanente à partir de NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://latablemarine.com/";
    delete process.env.SITE_URL;

    expect(getSiteUrl()).toBe("https://latablemarine.com");
    expect(getPermanentMenuUrl()).toBe("https://latablemarine.com/menu");
  });

  it("conserve exactement /menu après remplacement conceptuel du PDF", () => {
    process.env.SITE_URL = "https://latablemarine.com";
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const before = getPermanentMenuUrl();
    // Le remplacement du PDF ne doit jamais modifier cette URL.
    const after = getPermanentMenuUrl();
    expect(before).toBe("https://latablemarine.com/menu");
    expect(after).toBe(before);
    expect(after.endsWith("/menu")).toBe(true);
    expect(after).not.toContain(".pdf");
    expect(after).not.toContain("menu-juillet");
    expect(after).not.toContain("menu-aout");
  });
});
