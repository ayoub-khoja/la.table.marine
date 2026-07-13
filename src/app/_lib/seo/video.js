import { absoluteUrl, SEO_CONFIG } from "./config";

/**
 * Vidéo de présentation du restaurant (bannière d'accueil).
 * uploadDate : date du premier commit git de public/video/banner.mp4 (2026-07-10).
 * duration : extraite via ffprobe (17,02 s → PT17S).
 */
export const RESTAURANT_VIDEO = {
  name: "La Table Marine — ambiance du restaurant à Plaisir",
  description:
    "Vidéo de présentation de La Table Marine, restaurant de poissons et fruits de mer situé à Plaisir dans les Yvelines.",
  contentPath: "/video/banner.mp4",
  posterPath: "/images/video/restaurant-la-table-marine-poster.webp",
  embedPath: "/decouvrir-le-restaurant-en-video",
  width: 576,
  height: 1024,
  /** @type {string} ISO 8601 date (YYYY-MM-DD) */
  uploadDate: "2026-07-10",
  /** @type {string} ISO 8601 duration */
  duration: "PT17S",
  mimeType: "video/mp4",
  fallbackText:
    "Votre navigateur ne prend pas en charge la lecture vidéo. Découvrez La Table Marine à Plaisir en réservant une table ou en consultant notre carte.",
};

/**
 * @returns {string}
 */
export function getRestaurantVideoContentUrl() {
  return absoluteUrl(RESTAURANT_VIDEO.contentPath);
}

/**
 * @returns {string}
 */
export function getRestaurantVideoThumbnailUrl() {
  return absoluteUrl(RESTAURANT_VIDEO.posterPath);
}

/**
 * @returns {string}
 */
export function getRestaurantVideoEmbedUrl() {
  return absoluteUrl(RESTAURANT_VIDEO.embedPath);
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildRestaurantVideoPublisher() {
  return {
    "@type": "Organization",
    "@id": `${SEO_CONFIG.siteUrl}/#organization`,
    name: SEO_CONFIG.businessName,
    logo: {
      "@type": "ImageObject",
      url: SEO_CONFIG.logoUrl,
    },
  };
}
