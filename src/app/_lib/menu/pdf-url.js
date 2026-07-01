/** Zoom par défaut du PDF carte menu (lecteur Chrome / Adobe). */
export const MENU_PDF_DEFAULT_ZOOM = 163;

export function withMenuPdfViewOptions(fileUrl, origin) {
  const url = new URL(fileUrl, origin);
  url.hash = `page=1&zoom=${MENU_PDF_DEFAULT_ZOOM}`;
  return url;
}
