/**
 * Routes publiques destinées à l'indexation (sitemap).
 * @type {Array<{ path: string, changeFrequency: import('next').MetadataRoute.Sitemap[number]['changeFrequency'], priority: number }>}
 */
export const INDEXABLE_STATIC_ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.9 },
  { path: "/reservation", changeFrequency: "weekly", priority: 0.95 },
  { path: "/decouvrir-le-restaurant-en-video", changeFrequency: "monthly", priority: 0.7 },
  { path: "/politique-de-confidentialite", changeFrequency: "yearly", priority: 0.3 },
  { path: "/politique-de-cookies", changeFrequency: "yearly", priority: 0.3 },
];

/**
 * Routes publiques mais volontairement exclues de l'indexation (démos, e-commerce template, doublons).
 */
export const NOINDEX_PUBLIC_ROUTES = [
  "/home-2",
  "/home-3",
  "/onepage",
  "/menu-2",
  "/reservation-2",
  "/shop",
  "/products",
  "/product",
  "/cart",
  "/checkout",
  "/search",
  "/about-chef",
  "/history",
  "/services",
  "/blog",
];

/**
 * Préfixes bloqués dans robots.txt (pas une sécurité, l'auth reste requise).
 */
export const ROBOTS_DISALLOW_PREFIXES = ["/admin", "/api"];

/**
 * @param {string} pathname
 */
export function isNoindexPublicRoute(pathname) {
  return NOINDEX_PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * @param {string} pathname
 */
export function isIndexableRoute(pathname) {
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return false;
  if (isNoindexPublicRoute(pathname)) return false;
  if (INDEXABLE_STATIC_ROUTES.some((r) => r.path === pathname)) return true;
  if (pathname.startsWith("/blog/")) return true;
  return false;
}
