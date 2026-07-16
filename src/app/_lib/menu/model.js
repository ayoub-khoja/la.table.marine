import { withMenuCacheBuster } from "@library/menu/pdf-url";

/** Collection MongoDB pour la carte menu PDF */
export const CARTE_MENU_COLLECTION = "carte-menu";

export const CARTE_MENU_MIME = "application/pdf";

/** Limite existante du projet (15 Mo). */
export const CARTE_MENU_MAX_BYTES = 15 * 1024 * 1024;

/**
 * @typedef {object} CarteMenuDocument
 * @property {string} title
 * @property {string} fileName
 * @property {string} [originalFileName]
 * @property {string} fileUrl
 * @property {string} [storageKey]
 * @property {number} fileSize
 * @property {string} mimeType
 * @property {boolean} active
 * @property {number} [version]
 * @property {string} [uploadedBy]
 * @property {string} [storage]
 * @property {string|null} [gridFsId]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @param {import("mongodb").WithId<import("mongodb").Document> | null | undefined} doc
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

  const originalFileName = doc.originalFileName || doc.fileName || null;
  const storageKey = doc.storageKey || doc.gridFsId || null;

  return {
    id: doc._id.toString(),
    title: doc.title,
    fileName: originalFileName,
    originalFileName,
    fileUrl: withMenuCacheBuster(doc.fileUrl, {
      updatedAt,
      gridFsId: doc.gridFsId || null,
      version: doc.version,
    }),
    storageKey,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    storage: doc.storage || (doc.gridFsId ? "gridfs" : "disk"),
    gridFsId: doc.gridFsId || null,
    active: Boolean(doc.active),
    isActive: Boolean(doc.active),
    version: Number(doc.version) || 1,
    uploadedBy: doc.uploadedBy || null,
    publicPath: "/menu",
    createdAt,
    updatedAt,
  };
}
