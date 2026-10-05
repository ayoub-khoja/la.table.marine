import { getDb } from "@library/mongodb/client";
import {
  CARTE_MENU_COLLECTION,
  CARTE_MENU_MIME,
  formatCarteMenu,
} from "@library/menu/model";
import { deleteStoredMenuPdf, saveMenuPdfForStore } from "@library/menu/pdf-storage";

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
 * Dernier menu connu (actif ou non) — usage administration.
 */
export async function getLatestCarteMenu() {
  const db = await getDb();
  const doc = await db
    .collection(CARTE_MENU_COLLECTION)
    .findOne({}, { sort: { updatedAt: -1, version: -1 } });

  return formatCarteMenu(doc);
}

/**
 * @param {import("mongodb").Db} db
 */
async function getNextMenuVersion(db) {
  const latest = await db
    .collection(CARTE_MENU_COLLECTION)
    .findOne({}, { sort: { version: -1, updatedAt: -1 }, projection: { version: 1 } });

  return (Number(latest?.version) || 0) + 1;
}

/**
 * Désactive les anciens menus et enregistre le nouveau PDF actif.
 * @param {object} payload
 */
export async function createActiveCarteMenu(payload) {
  const db = await getDb();
  const collection = db.collection(CARTE_MENU_COLLECTION);
  const now = new Date();
  const version = await getNextMenuVersion(db);

  await collection.updateMany(
    { active: true },
    { $set: { active: false, updatedAt: now } }
  );

  const originalFileName = payload.originalFileName || payload.fileName;
  const doc = {
    title: (payload.title || "Carte Menu").trim(),
    fileName: originalFileName,
    originalFileName,
    fileUrl: payload.fileUrl,
    storageKey: payload.storageKey || payload.gridFsId || null,
    fileSize: payload.fileSize,
    mimeType: payload.mimeType || CARTE_MENU_MIME,
    storage: payload.storage || (payload.gridFsId ? "gridfs" : "disk"),
    gridFsId: payload.gridFsId || null,
    active: true,
    version,
    uploadedBy: payload.uploadedBy || null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return formatCarteMenu({ _id: result.insertedId, ...doc });
}

/**
 * Remplacement sécurisé : import complet → mise à jour référence → suppression ancien.
 * En cas d'échec d'import, l'ancien menu reste disponible.
 * @param {File | (Blob & { name?: string; type?: string; size?: number })} file
 * @param {{ title?: string, uploadedBy?: string }} [options]
 */
export async function replaceCarteMenuPdf(file, options = {}) {
  const previous = await getLatestCarteMenu();
  const saved = await saveMenuPdfForStore(file);

  try {
    const menu = await createActiveCarteMenu({
      title: options.title || "Carte Menu",
      fileName: saved.fileName,
      originalFileName: saved.originalFileName || saved.fileName,
      fileUrl: saved.fileUrl,
      fileSize: saved.fileSize,
      mimeType: saved.mimeType,
      storage: saved.storage,
      gridFsId: saved.gridFsId,
      storageKey: saved.storageKey,
      uploadedBy: options.uploadedBy || null,
    });

    if (
      previous &&
      (previous.gridFsId || previous.storageKey) &&
      previous.gridFsId !== saved.gridFsId &&
      previous.storageKey !== saved.storageKey
    ) {
      await deleteStoredMenuPdf({
        storage: previous.storage,
        gridFsId: previous.gridFsId,
        storageKey: previous.storageKey,
        fileUrl: previous.fileUrl,
      });
    }

    return {
      menu,
      created: !previous,
      previousKeptOnFailure: false,
    };
  } catch (error) {
    await deleteStoredMenuPdf({
      storage: saved.storage,
      gridFsId: saved.gridFsId,
      storageKey: saved.storageKey,
      fileUrl: saved.fileUrl,
    });
    throw error;
  }
}

/**
 * Publie ou désactive temporairement le menu courant.
 * Un seul menu actif à la fois.
 * @param {boolean} active
 */
export async function setCarteMenuActive(active) {
  const db = await getDb();
  const collection = db.collection(CARTE_MENU_COLLECTION);
  const now = new Date();
  const latest = await collection.findOne({}, { sort: { updatedAt: -1, version: -1 } });

  if (!latest) {
    return null;
  }

  if (active) {
    await collection.updateMany(
      { _id: { $ne: latest._id }, active: true },
      { $set: { active: false, updatedAt: now } }
    );
  }

  await collection.updateOne(
    { _id: latest._id },
    { $set: { active: Boolean(active), updatedAt: now } }
  );

  const updated = await collection.findOne({ _id: latest._id });
  return formatCarteMenu(updated);
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
    originalFileName: payload.originalFileName || payload.fileName || payload.filename,
    fileUrl: payload.fileUrl || payload.url,
    fileSize: payload.fileSize ?? payload.size,
    mimeType: payload.mimeType || CARTE_MENU_MIME,
  });
}
