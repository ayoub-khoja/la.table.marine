import { promises as fs } from "fs";
import path from "path";
import { GridFSBucket, ObjectId } from "mongodb";

import { getDb } from "@library/mongodb/client";
import { CARTE_MENU_MIME } from "@library/menu/model";
import { validateAndReadPdf } from "@library/menu/validate-pdf";

const BUCKET_NAME = "carte-menu-pdfs";

function getBucket(db) {
  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

export function shouldUseGridFsStorage() {
  return Boolean(process.env.VERCEL);
}

/**
 * @param {Buffer} buffer
 * @param {{ fileName: string }} options
 */
async function saveMenuPdfToGridFs(buffer, { fileName }) {
  const db = await getDb();
  const bucket = getBucket(db);
  const storageKey = `menu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(storageKey, {
      contentType: CARTE_MENU_MIME,
      metadata: { fileName, originalFileName: fileName },
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => {
      resolve({
        fileName,
        originalFileName: fileName,
        fileSize: buffer.length,
        mimeType: CARTE_MENU_MIME,
        fileUrl: "/api/menu/file",
        storageKey: uploadStream.id.toString(),
        gridFsId: uploadStream.id.toString(),
        storage: "gridfs",
      });
    });

    uploadStream.end(buffer);
  });
}

/**
 * @param {Buffer} buffer
 * @param {{ fileName: string }} options
 */
async function saveMenuPdfToDisk(buffer, { fileName }) {
  const dir = path.join(process.cwd(), "public", "uploads", "menu");
  await fs.mkdir(dir, { recursive: true });

  const storedName = `menu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
  const filepath = path.join(dir, storedName);
  await fs.writeFile(filepath, buffer);

  return {
    fileName,
    originalFileName: fileName,
    fileSize: buffer.length,
    mimeType: CARTE_MENU_MIME,
    fileUrl: `/uploads/menu/${storedName}`,
    storageKey: storedName,
    gridFsId: null,
    storage: "disk",
  };
}

/**
 * Enregistre le PDF sur disque (local) ou dans MongoDB GridFS (Vercel).
 * Valide le contenu avant écriture. N'écrit jamais sur l'ancien fichier.
 * @param {File | (Blob & { name?: string; type?: string; size?: number })} file
 */
export async function saveMenuPdfForStore(file) {
  const validated = await validateAndReadPdf(file);

  if (shouldUseGridFsStorage()) {
    return saveMenuPdfToGridFs(validated.buffer, {
      fileName: validated.originalFileName,
    });
  }

  try {
    return await saveMenuPdfToDisk(validated.buffer, {
      fileName: validated.originalFileName,
    });
  } catch (diskError) {
    console.warn(
      "[menu] Écriture disque impossible, bascule GridFS :",
      diskError instanceof Error ? diskError.message : diskError
    );
    return saveMenuPdfToGridFs(validated.buffer, {
      fileName: validated.originalFileName,
    });
  }
}

/**
 * @param {string} gridFsId
 */
export async function openMenuPdfStream(gridFsId) {
  if (!gridFsId) {
    throw new Error("GRIDFS_ID_MISSING");
  }

  const db = await getDb();
  const bucket = getBucket(db);
  const objectId = new ObjectId(gridFsId);
  const files = await bucket.find({ _id: objectId }).toArray();

  if (!files.length) {
    throw new Error("GRIDFS_FILE_NOT_FOUND");
  }

  return {
    stream: bucket.openDownloadStream(objectId),
    file: files[0],
  };
}

/**
 * Suppression best-effort de l'ancien fichier (après succès du nouvel import).
 * @param {{ storage?: string, gridFsId?: string|null, storageKey?: string|null, fileUrl?: string }} previous
 */
export async function deleteStoredMenuPdf(previous) {
  if (!previous) return;

  try {
    if (previous.gridFsId || previous.storage === "gridfs") {
      const id = previous.gridFsId || previous.storageKey;
      if (!id) return;

      const db = await getDb();
      const bucket = getBucket(db);
      await bucket.delete(new ObjectId(id));
      return;
    }

    const key =
      previous.storageKey ||
      (previous.fileUrl?.startsWith("/uploads/menu/")
        ? path.basename(previous.fileUrl.split("?")[0])
        : null);

    if (!key || key.includes("..") || key.includes("/") || key.includes("\\")) {
      return;
    }

    const filepath = path.join(process.cwd(), "public", "uploads", "menu", key);
    await fs.unlink(filepath);
  } catch (error) {
    console.warn(
      "[menu] Suppression de l'ancien PDF ignorée :",
      error instanceof Error ? error.message : error
    );
  }
}
