import { getDb } from "@library/mongodb/client";
import {
  CARTE_MENU_COLLECTION,
  CARTE_MENU_MIME,
  formatCarteMenu,
} from "@library/menu/model";

/**
 * Retourne le menu PDF actif le plus récent.
 */
export async function getActiveCarteMenu() {
  const db = await getDb();
  const doc = await db
    .collection(CARTE_MENU_COLLECTION)
    .findOne({ active: true }, { sort: { updatedAt: -1 } });

  return formatCarteMenu(doc);
}

/**
 * Désactive les anciens menus et enregistre le nouveau PDF actif.
 * @param {object} payload
 * @param {string} payload.title
 * @param {string} payload.fileName
 * @param {string} payload.fileUrl
 * @param {number} payload.fileSize
 * @param {string} [payload.mimeType]
 */
export async function createActiveCarteMenu(payload) {
  const db = await getDb();
  const collection = db.collection(CARTE_MENU_COLLECTION);
  const now = new Date();

  await collection.updateMany(
    { active: true },
    { $set: { active: false, updatedAt: now } }
  );

  const doc = {
    title: (payload.title || "Carte Menu").trim(),
    fileName: payload.fileName,
    fileUrl: payload.fileUrl,
    fileSize: payload.fileSize,
    mimeType: payload.mimeType || CARTE_MENU_MIME,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return formatCarteMenu({ _id: result.insertedId, ...doc });
}

/** @deprecated Alias admin — utilise getActiveCarteMenu */
export async function getMenuUpload() {
  return getActiveCarteMenu();
}

/** @deprecated Alias admin — utilise createActiveCarteMenu */
export async function saveMenuUpload(payload) {
  return createActiveCarteMenu({
    title: payload.title || "Carte Menu",
    fileName: payload.fileName || payload.filename,
    fileUrl: payload.fileUrl || payload.url,
    fileSize: payload.fileSize ?? payload.size,
    mimeType: payload.mimeType || CARTE_MENU_MIME,
  });
}
