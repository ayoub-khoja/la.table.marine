import { withMenuCacheBuster } from "@library/menu/pdf-url";

/** Collection MongoDB pour la carte menu PDF */
export const CARTE_MENU_COLLECTION = "carte-menu";

export const CARTE_MENU_MIME = "application/pdf";

export const CARTE_MENU_MAX_BYTES = 15 * 1024 * 1024;

/**
 * @typedef {object} CarteMenuDocument
 * @property {string} title
 * @property {string} fileName
 * @property {string} fileUrl
 * @property {number} fileSize
 * @property {string} mimeType
 * @property {boolean} active
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @param {import("mongodb").WithId<import("mongodb").Document>} doc
 */
export function formatCarteMenu(doc) {
  if (!doc) return null;

  const createdAt =
    doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : doc.createdAt;
  const updatedAt =
    doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : doc.updatedAt;

  return {
    id: doc._id.toString(),
    title: doc.title,
    fileName: doc.fileName,
    fileUrl: withMenuCacheBuster(doc.fileUrl, {
      updatedAt,
      gridFsId: doc.gridFsId || null,
    }),
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    storage: doc.storage || (doc.gridFsId ? "gridfs" : "disk"),
    gridFsId: doc.gridFsId || null,
    active: doc.active,
    createdAt,
    updatedAt,
  };
}
