import AppData from "@data/app.json";
import ScheduleData from "@data/sections/schedule.json";

/** @typedef {{ dayOfWeek: string[], opens: string, closes: string }} OpeningHoursSpec */

export const SEO_SITE_URL = (
  process.env.SITE_URL?.trim() || "https://latablemarine.com"
).replace(/\/$/, "");

export const SEO_CONFIG = {
  siteName: AppData.settings.siteName || "La Table Marine",
  siteUrl: SEO_SITE_URL,
  locale: "fr_FR",
  language: "fr",
  defaultTitle: "La Table Marine | Restaurant de poissons et fruits de mer à Plaisir",
  titleTemplate: "%s | La Table Marine",
  defaultDescription:
    "Découvrez La Table Marine, restaurant de poissons et fruits de mer à Plaisir. Produits frais, cuisine raffinée et ambiance chaleureuse. Réservez votre table.",
  businessName: "La Table Marine",
  businessType: "Restaurant",
  alternateName: "La Table Marine Plaisir",
  telephone: "+33188937672",
  telephoneDisplay: "01 88 93 76 72",
  email: "contact@latablemarine.com",
  address: {
    streetAddress: "2 rue Pierre Curie",
    addressLocality: "Plaisir",
    postalCode: "78370",
    addressRegion: "Yvelines",
    addressCountry: "FR",
    display: "2, rue Pierre Curie, 78370 Plaisir",
  },
  geo: {
    latitude: AppData.settings.googleMaps?.lat ?? 48.82386,
    longitude: AppData.settings.googleMaps?.lng ?? 1.94528,
  },
  priceRange: "€€",
  cuisineTypes: [
    "Fruits de mer",
    "Poisson",
    "Cuisine française",
    "Cuisine du terroir",
  ],
  menuUrl: `${SEO_SITE_URL}/api/menu/file`,
  menuPdfUrl: `${SEO_SITE_URL}/api/menu/file`,
  reservationUrl: `${SEO_SITE_URL}/reservation`,
  contactUrl: `${SEO_SITE_URL}/contact`,
  logoUrl: `${SEO_SITE_URL}/img/home/logo-latablemarine.png`,
  defaultOgImage: `${SEO_SITE_URL}/img/image00015.png`,
  areaServed: ["Plaisir", "Yvelines", "Île-de-France"],
  /**
   * TODO: Remplacer par les URLs réelles des profils sociaux (Google Business, Instagram, Facebook…).
   * Les liens actuels dans app.json sont des placeholders génériques.
   */
  socialProfiles: [],
  openingHours: buildOpeningHoursFromSchedule(),
  acceptsReservations: true,
  paymentAccepted: null,
  currenciesAccepted: "EUR",
};

/**
 * @returns {OpeningHoursSpec[]}
 */
function buildOpeningHoursFromSchedule() {
  const specs = [];

  for (const group of ScheduleData.groups || []) {
    const days =
      group.id === "weekend"
        ? ["Friday", "Saturday"]
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"];

    const lunch = parseHourRange(group.lunch);
    const dinner = parseHourRange(group.dinner);

    if (lunch) {
      specs.push({
        dayOfWeek: days,
        opens: lunch.opens,
        closes: lunch.closes,
      });
    }

    if (dinner) {
      specs.push({
        dayOfWeek: days,
        opens: dinner.opens,
        closes: dinner.closes,
      });
    }
  }

  return specs;
}

/**
 * @param {string} range
 */
function parseHourRange(range) {
  const match = range?.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  return { opens: normalizeTime(match[1]), closes: normalizeTime(match[2]) };
}

/**
 * @param {string} value
 */
function normalizeTime(value) {
  const [h, m] = value.split(":");
  return `${String(h).padStart(2, "0")}:${m}`;
}

/**
 * @param {string} [path]
 * @returns {string}
 */
export function absoluteUrl(path = "/") {
  if (!path || path === "/") return `${SEO_SITE_URL}/`;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path.replace(/\/$/, "") || path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SEO_SITE_URL}${normalized}`;
}
