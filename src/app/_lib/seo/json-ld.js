import { absoluteUrl, SEO_CONFIG } from "./config";

/**
 * Sérialise du JSON-LD en évitant l'injection de balises script.
 * @param {unknown} data
 */
export function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildPostalAddress() {
  return {
    "@type": "PostalAddress",
    streetAddress: SEO_CONFIG.address.streetAddress,
    addressLocality: SEO_CONFIG.address.addressLocality,
    postalCode: SEO_CONFIG.address.postalCode,
    addressRegion: SEO_CONFIG.address.addressRegion,
    addressCountry: SEO_CONFIG.address.addressCountry,
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildGeoCoordinates() {
  return {
    "@type": "GeoCoordinates",
    latitude: SEO_CONFIG.geo.latitude,
    longitude: SEO_CONFIG.geo.longitude,
  };
}

/**
 * @returns {Record<string, unknown>[]}
 */
export function buildOpeningHoursSpecification() {
  return SEO_CONFIG.openingHours.map((slot) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: slot.dayOfWeek,
    opens: slot.opens,
    closes: slot.closes,
  }));
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildRestaurantSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${SEO_CONFIG.siteUrl}/#restaurant`,
    name: SEO_CONFIG.businessName,
    alternateName: SEO_CONFIG.alternateName,
    url: SEO_CONFIG.siteUrl,
    logo: SEO_CONFIG.logoUrl,
    image: SEO_CONFIG.defaultOgImage,
    description: SEO_CONFIG.defaultDescription,
    telephone: SEO_CONFIG.telephone,
    email: SEO_CONFIG.email,
    address: buildPostalAddress(),
    geo: buildGeoCoordinates(),
    openingHoursSpecification: buildOpeningHoursSpecification(),
    servesCuisine: SEO_CONFIG.cuisineTypes,
    priceRange: SEO_CONFIG.priceRange,
    menu: SEO_CONFIG.menuPdfUrl,
    acceptsReservations: SEO_CONFIG.acceptsReservations,
    areaServed: SEO_CONFIG.areaServed.map((name) => ({
      "@type": "City",
      name,
    })),
    currenciesAccepted: SEO_CONFIG.currenciesAccepted,
  };

  if (SEO_CONFIG.socialProfiles.length > 0) {
    schema.sameAs = SEO_CONFIG.socialProfiles;
  }

  return schema;
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildOrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SEO_CONFIG.siteUrl}/#organization`,
    name: SEO_CONFIG.businessName,
    url: SEO_CONFIG.siteUrl,
    logo: SEO_CONFIG.logoUrl,
    email: SEO_CONFIG.email,
    telephone: SEO_CONFIG.telephone,
    address: buildPostalAddress(),
  };

  if (SEO_CONFIG.socialProfiles.length > 0) {
    schema.sameAs = SEO_CONFIG.socialProfiles;
  }

  return schema;
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SEO_CONFIG.siteUrl}/#website`,
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    inLanguage: SEO_CONFIG.language,
    publisher: {
      "@id": `${SEO_CONFIG.siteUrl}/#organization`,
    },
  };
}

/**
 * @param {object} input
 * @param {string} input.path
 * @param {string} input.title
 * @param {string} input.description
 * @returns {Record<string, unknown>}
 */
export function buildWebPageSchema({ path, title, description }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: title,
    description,
    isPartOf: {
      "@id": `${SEO_CONFIG.siteUrl}/#website`,
    },
    inLanguage: SEO_CONFIG.language,
  };
}

/**
 * @param {Array<{ name: string, path: string }>} items
 * @returns {Record<string, unknown>}
 */
export function buildBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Schémas pour la page d'accueil.
 * @returns {Record<string, unknown>[]}
 */
export function buildHomeSchemas() {
  return [
    buildRestaurantSchema(),
    buildOrganizationSchema(),
    buildWebSiteSchema(),
    buildWebPageSchema({
      path: "/",
      title: SEO_CONFIG.defaultTitle,
      description: SEO_CONFIG.defaultDescription,
    }),
  ];
}

/**
 * @param {object} input
 * @param {string} input.path
 * @param {string} input.title
 * @param {string} input.description
 * @param {Array<{ name: string, path: string }>} input.breadcrumbs
 * @returns {Record<string, unknown>[]}
 */
export function buildSecondaryPageSchemas({ path, title, description, breadcrumbs }) {
  const schemas = [
    buildWebPageSchema({ path, title, description }),
    buildBreadcrumbSchema(breadcrumbs),
  ];

  if (path === "/contact") {
    schemas.unshift(buildRestaurantSchema());
  }

  if (path === "/menu") {
    schemas.unshift({
      ...buildRestaurantSchema(),
      hasMenu: {
        "@type": "Menu",
        url: SEO_CONFIG.menuPdfUrl,
        name: "Carte La Table Marine",
      },
    });
  }

  return schemas;
}
