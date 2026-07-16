/**
 * Ajoute un paramètre de version pour éviter le cache navigateur/CDN
 * quand l'URL du menu reste identique (`/api/menu/file`).
 * @param {string} fileUrl
 * @param {{ updatedAt?: string | Date, gridFsId?: string | null, version?: number }} [meta]
 */
export function withMenuCacheBuster(fileUrl, meta = {}) {
  if (!fileUrl || fileUrl.startsWith("/uploads/")) {
    return fileUrl;
  }

  const version =
    meta.gridFsId ||
    (meta.version != null ? String(meta.version) : null) ||
    (meta.updatedAt ? new Date(meta.updatedAt).getTime() : null);

  if (!version || (!meta.gridFsId && !meta.version && Number.isNaN(Number(version)))) {
    return fileUrl;
  }

  const url = new URL(fileUrl, "http://localhost");
  url.searchParams.set("v", String(version));
  return `${url.pathname}${url.search}`;
}

/** Zoom par défaut du PDF carte menu (lecteur Chrome / Adobe). */
export const MENU_PDF_DEFAULT_ZOOM = 90;

export function withMenuPdfViewOptions(fileUrl, origin, meta = {}) {
  const versionedUrl = withMenuCacheBuster(fileUrl, meta);
  const url = new URL(versionedUrl, origin);
  url.hash = `page=1&zoom=${MENU_PDF_DEFAULT_ZOOM}`;
  return url;
}
