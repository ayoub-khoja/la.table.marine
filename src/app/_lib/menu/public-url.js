/**
 * URL publique du site (sans slash final).
 * Priorité : NEXT_PUBLIC_SITE_URL → SITE_URL → domaine de production.
 */
export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "https://latablemarine.com";

  return raw.replace(/\/$/, "");
}

/** URL permanente encodée dans le QR code — ne jamais y mettre le nom du PDF. */
export function getPermanentMenuUrl() {
  return `${getSiteUrl()}/menu`;
}

/** Chemin public stable (relatif). */
export const PERMANENT_MENU_PATH = "/menu";
