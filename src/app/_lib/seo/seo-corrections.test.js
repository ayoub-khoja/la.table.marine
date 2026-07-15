import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import AppData from "@data/app.json";
import { getPublishedPostStaticParams, isPostPublished } from "@library/posts";
import { SEO_CONFIG, SEO_SITE_URL } from "./config";
import { buildRestaurantSchema, buildSecondaryPageSchemas } from "./json-ld";
import { getPageMetadata } from "./page-metadata";
import {
  INDEXABLE_STATIC_ROUTES,
  NOINDEX_PUBLIC_ROUTES,
  isIndexableRoute,
} from "./routes";

const projectRoot = process.cwd();

describe("seo corrections — domaine", () => {
  it("utilise le domaine canonique sans www", () => {
    expect(SEO_SITE_URL).toBe("https://latablemarine.com");
    expect(SEO_CONFIG.siteUrl).not.toContain("www.");
  });

  it("n'expose pas www.latablemarine.com dans la config SEO", () => {
    const seoDir = path.join(projectRoot, "src/app/_lib/seo");
    const files = fs
      .readdirSync(seoDir)
      .filter((file) => file.endsWith(".js") && !file.endsWith(".test.js"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(seoDir, file), "utf8");
      expect(content).not.toContain("www.latablemarine.com");
    }
  });
});

describe("seo corrections — page /menu", () => {
  it("redirige côté serveur vers le PDF officiel", () => {
    const menuPage = fs.readFileSync(
      path.join(projectRoot, "src/app/(pages)/menu/page.jsx"),
      "utf8"
    );
    expect(menuPage).toContain('redirect("/api/menu/file")');
    expect(menuPage).toContain('from "next/navigation"');
    expect(menuPage).not.toContain("MenuPageClient");
    expect(menuPage).not.toContain("useEffect");
    expect(menuPage).not.toContain("window.location.replace");
    expect(menuPage).not.toContain("MenuPageContent");
    expect(menuPage).not.toContain("<object");
  });
});

describe("seo corrections — navigation", () => {
  it("ouvre le menu principal dans un nouvel onglet", () => {
    const menuItem = AppData.header.menu.find((item) =>
      item.label.toLowerCase().includes("carte")
    );
    expect(menuItem?.link).toBe("/api/menu/file");
    expect(menuItem?.blank).toBe(1);
  });

  it("ouvre le lien footer nav menu dans un nouvel onglet", () => {
    const footerMenu = AppData.footer.nav.find((item) =>
      item.label.toLowerCase().includes("carte")
    );
    expect(footerMenu?.link).toBe("/api/menu/file");
    expect(footerMenu?.blank).toBe(1);
  });

  it("ouvre le bouton footer about menu dans un nouvel onglet", () => {
    expect(AppData.footer.about.button.link).toBe("/api/menu/file");
    expect(AppData.footer.about.button.blank).toBe(1);
  });

  it("utilise target=\"_blank\" et rel=\"noopener noreferrer\" dans le header", () => {
    const header = fs.readFileSync(
      path.join(projectRoot, "src/app/_layouts/headers/LayoutDefault.jsx"),
      "utf8"
    );
    expect(header).toContain('target="_blank"');
    expect(header).toContain('rel="noopener noreferrer"');
  });

  it("utilise target=\"_blank\" et rel=\"noopener noreferrer\" dans le footer", () => {
    const footer = fs.readFileSync(
      path.join(projectRoot, "src/app/_layouts/footers/LayoutDefault.jsx"),
      "utf8"
    );
    expect(footer).toContain('target="_blank"');
    expect(footer).toContain('rel="noopener noreferrer"');
  });
});

describe("seo corrections — reservation, search, demo pages", () => {
  it("expose un H1 sur /reservation", () => {
    const reservationPage = fs.readFileSync(
      path.join(projectRoot, "src/app/(pages)/reservation/page.jsx"),
      "utf8"
    );
    expect(reservationPage).toContain("<h1");
    expect(reservationPage).toContain("Réservez votre table à La Table Marine");
  });

  it("met /search en noindex, follow", () => {
    const meta = getPageMetadata("search");
    expect(meta.robots?.index).toBe(false);
    expect(meta.robots?.follow).toBe(true);
    expect(meta.title).toBe("Recherche");
  });

  it("noindex les pages de démonstration", () => {
    for (const key of ["aboutChef", "history", "services"]) {
      const meta = getPageMetadata(key);
      expect(meta.robots?.index).toBe(false);
      expect(meta.robots?.follow).toBe(true);
    }
  });
});

describe("seo corrections — sitemap et blog", () => {
  it("exclut temporairement /menu et /api/menu/file du sitemap", () => {
    const paths = INDEXABLE_STATIC_ROUTES.map((route) => route.path);
    expect(paths).not.toContain("/menu");
    expect(paths).not.toContain("/api/menu/file");
    expect(paths).toContain("/");
    expect(paths).toContain("/about");
    expect(paths).toContain("/contact");
    expect(paths).toContain("/reservation");
    expect(paths).toContain("/decouvrir-le-restaurant-en-video");
    expect(paths).toContain("/politique-de-confidentialite");
    expect(paths).toContain("/politique-de-cookies");
  });

  it("n'inclut pas les pages noindex dans les routes statiques du sitemap", () => {
    const paths = INDEXABLE_STATIC_ROUTES.map((route) => route.path);
    expect(paths).not.toContain("/about-chef");
    expect(paths).not.toContain("/history");
    expect(paths).not.toContain("/services");
    expect(paths).not.toContain("/search");
    expect(paths).not.toContain("/blog");
  });

  it("exclut les articles draft du statut publié", () => {
    expect(
      isPostPublished({
        id: "demo",
        title: "Demo",
        draft: true,
      })
    ).toBe(false);
    expect(
      isPostPublished({
        id: "demo",
        title: "Demo",
        index: false,
      })
    ).toBe(false);
    expect(
      isPostPublished({
        id: "demo",
        title: "Demo",
      })
    ).toBe(true);
  });

  it("marque les neuf articles de démonstration comme draft", () => {
    const demoSlugs = [
      "incredible-vegan-mac-and-cheese",
      "the-office-business-lunch",
      "the-best-chicken-tinga-tacos",
      "new-breakfast-menu-renaissance",
      "beet-and-burrata-salad-with-fried-bread",
      "tips-for-planning-a-menu",
      "join-us-for-plant-powered-january",
      "creamy-kale-pasta",
      "quinoa-sweet-potato-salad",
    ];

    for (const slug of demoSlugs) {
      const content = fs.readFileSync(
        path.join(projectRoot, "src/data/posts", `${slug}.md`),
        "utf8"
      );
      expect(content).toMatch(/draft:\s*true/);
      expect(content).toMatch(/index:\s*false/);
    }
  });

  it("n'affiche plus d'articles populaires de démonstration", () => {
    const popularPosts = JSON.parse(
      fs.readFileSync(
        path.join(projectRoot, "src/data/sections/popular-posts.json"),
        "utf8"
      )
    );
    expect(popularPosts.featured).toEqual([]);
  });

  it("exclut les articles draft de generateStaticParams", () => {
    const staticParams = getPublishedPostStaticParams();
    const demoSlugs = [
      "incredible-vegan-mac-and-cheese",
      "the-office-business-lunch",
      "the-best-chicken-tinga-tacos",
      "new-breakfast-menu-renaissance",
      "beet-and-burrata-salad-with-fried-bread",
      "tips-for-planning-a-menu",
      "join-us-for-plant-powered-january",
      "creamy-kale-pasta",
      "quinoa-sweet-potato-salad",
    ];

    expect(staticParams).toEqual([]);
    for (const slug of demoSlugs) {
      expect(staticParams.map((item) => item.id)).not.toContain(slug);
    }
  });

  it("appelle notFound() pour les articles draft ou non publiés", () => {
    const blogPage = fs.readFileSync(
      path.join(projectRoot, "src/app/(pages)/blog/[id]/page.jsx"),
      "utf8"
    );

    expect(blogPage).toContain("getPublishedPostStaticParams");
    expect(blogPage).toContain("!isPostPublished(postData)");
    expect(blogPage).toContain("notFound()");
  });

  it("permet toujours la publication d'articles futurs valides", () => {
    expect(
      isPostPublished({
        id: "nouvel-article",
        title: "Nouvel article",
        draft: false,
        index: true,
      })
    ).toBe(true);
  });
});

describe("seo corrections — JSON-LD menu", () => {
  it("n'expose pas menu ni hasMenu tant que l'URL publique n'est pas indexable", () => {
    const restaurant = buildRestaurantSchema();
    expect(restaurant.menu).toBeUndefined();
    expect(restaurant.hasMenu).toBeUndefined();

    const menuSchemas = buildSecondaryPageSchemas({
      path: "/menu",
      title: "Carte et menu",
      description: "Description menu",
      breadcrumbs: [
        { name: "Accueil", path: "/" },
        { name: "Menu", path: "/menu" },
      ],
    });

    const restaurantOnMenu = menuSchemas.find((item) => item["@type"] === "Restaurant");
    expect(restaurantOnMenu).toBeUndefined();
  });
});

describe("seo corrections — pages template désactivées", () => {
  const templateRoutes = [
    { slug: "about-chef", marker: "Oscar Oldman" },
    { slug: "history", marker: "Londres" },
    { slug: "services", marker: "Assumenda possimus" },
  ];

  it("retire les liens publics vers about-chef, history et services", () => {
    const appJson = JSON.stringify(AppData);
    expect(appJson).not.toContain("/about-chef");
    expect(appJson).not.toContain('"/history"');
    expect(appJson).not.toContain('"/services"');
  });

  it("appelle notFound() sur les pages template", () => {
    for (const route of templateRoutes) {
      const page = fs.readFileSync(
        path.join(projectRoot, `src/app/(pages)/${route.slug}/page.jsx`),
        "utf8"
      );
      expect(page).toContain("Page temporairement désactivée jusqu'à validation du contenu réel.");
      expect(page).toContain("notFound()");
    }
  });

  it("conserve le contenu source sans l'exposer via l'export par défaut", () => {
    for (const route of templateRoutes) {
      const page = fs.readFileSync(
        path.join(projectRoot, `src/app/(pages)/${route.slug}/page.jsx`),
        "utf8"
      );
      expect(page).toContain(route.marker);
      expect(page).not.toMatch(/export default function \w+\(\) {\s*return/);
    }
  });
});

describe("seo corrections — réseaux sociaux", () => {
  it("utilise item.link via SocialIconLinks dans About", () => {
    const aboutSection = fs.readFileSync(
      path.join(projectRoot, "src/app/_components/sections/About.jsx"),
      "utf8"
    );
    expect(aboutSection).toContain("SocialIconLinks");
    expect(aboutSection).toContain("items={AppData.social}");
    expect(aboutSection).not.toContain("item.url");
  });

  it("n'expose pas de liens génériques facebook.com ou instagram.com", () => {
    const socialComponent = fs.readFileSync(
      path.join(projectRoot, "src/app/_components/SocialIconLinks.jsx"),
      "utf8"
    );
    expect(socialComponent).toContain('target="_blank"');
    expect(socialComponent).toContain('rel="noopener noreferrer"');
    expect(socialComponent).toContain("getRenderableSocialItems");

    const aboutPage = fs.readFileSync(
      path.join(projectRoot, "src/app/(pages)/about/page.jsx"),
      "utf8"
    );
    expect(aboutPage).not.toContain("https://facebook.com");
    expect(aboutPage).not.toContain("https://instagram.com");
  });

  it("garde sameAs vide tant que les profils ne sont pas confirmés", () => {
    expect(SEO_CONFIG.socialProfiles).toEqual([]);

    const restaurant = buildRestaurantSchema();
    expect(restaurant.sameAs).toBeUndefined();
  });
});

describe("seo corrections — routes indexables", () => {
  it("exclut /menu du sitemap et garde /search non indexable", () => {
    expect(isIndexableRoute("/menu")).toBe(false);
    expect(isIndexableRoute("/search")).toBe(false);
    expect(isIndexableRoute("/about-chef")).toBe(false);
    expect(isIndexableRoute("/history")).toBe(false);
    expect(isIndexableRoute("/services")).toBe(false);
    expect(NOINDEX_PUBLIC_ROUTES).toContain("/blog");
  });
});
