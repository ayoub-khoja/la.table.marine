import { describe, expect, it } from "vitest";

import { buildPageMetadata } from "./metadata";
import { PAGE_SEO } from "./page-metadata";

describe("seo metadata", () => {
  it("génère une canonical absolue", () => {
    const meta = buildPageMetadata({
      title: "Test",
      description: "Description test",
      path: "/contact",
    });

    expect(meta.alternates?.canonical).toBe("https://latablemarine.com/contact");
  });

  it("canonical accueil avec slash final", () => {
    const meta = buildPageMetadata({
      title: PAGE_SEO.home.title,
      description: PAGE_SEO.home.description,
      path: "/",
    });

    expect(meta.alternates?.canonical).toBe("https://latablemarine.com/");
  });

  it("applique noindex quand demandé", () => {
    const meta = buildPageMetadata({
      title: "Demo",
      description: "Demo",
      path: "/home-2",
      noindex: true,
      nofollow: true,
    });

    expect(meta.robots?.index).toBe(false);
    expect(meta.robots?.follow).toBe(false);
  });

  it("garde des titles uniques pour les pages principales", () => {
    const titles = [
      PAGE_SEO.home.title,
      PAGE_SEO.about.title,
      PAGE_SEO.contact.title,
      PAGE_SEO.reservation.title,
      PAGE_SEO.menu.title,
    ];
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("garde des descriptions uniques pour les pages principales", () => {
    const descriptions = [
      PAGE_SEO.home.description,
      PAGE_SEO.about.description,
      PAGE_SEO.contact.description,
      PAGE_SEO.reservation.description,
      PAGE_SEO.menu.description,
    ];
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});
