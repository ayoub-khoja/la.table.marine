import { GridFSBucket, ObjectId } from "mongodb";

import { getDb } from "@library/mongodb/client";
import { CARTE_MENU_MIME } from "@library/menu/model";
import { saveUploadedMenuPdf } from "@library/uploads/save-file";

const BUCKET_NAME = "carte-menu-pdfs";

function getBucket(db) {
  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

function isFileLike(file) {
  return file && typeof file.arrayBuffer === "function";
}

function validatePdfFile(file, maxBytes = 15 * 1024 * 1024) {
  if (!isFileLike(file)) {
    throw new Error("INVALID_FILE");
  }

  if (file.type !== CARTE_MENU_MIME && !file.name?.toLowerCase().endsWith(".pdf")) {
    throw new Error("INVALID_TYPE");
  }

  if (file.size > maxBytes) {
    throw new Error("FILE_TOO_LARGE");
  }
}

export function shouldUseGridFsStorage() {
  return Boolean(process.env.VERCEL);
}

async function saveMenuPdfToGridFs(buffer, { fileName }) {
  const db = await getDb();
  const bucket = getBucket(db);

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(fileName || "carte-menu.pdf", {
      contentType: CARTE_MENU_MIME,
      metadata: { fileName },
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => {
      resolve({
        fileName,
        fileSize: buffer.length,
        mimeType: CARTE_MENU_MIME,
        fileUrl: "/api/menu/file",
        gridFsId: uploadStream.id.toString(),
        storage: "gridfs",
      });
    });

    uploadStream.end(buffer);
  });
}

/**
 * Enregistre le PDF sur disque (local) ou dans MongoDB GridFS (Vercel).
 */
export async function saveMenuPdfForStore(file) {
  validatePdfFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());

  if (shouldUseGridFsStorage()) {
    return saveMenuPdfToGridFs(buffer, { fileName: file.name });
  }

  try {
    const saved = await saveUploadedMenuPdf(file);
    return {
      ...saved,
      storage: "disk",
      gridFsId: null,
    };
  } catch (diskError) {
    console.warn("[menu] Écriture disque impossible, bascule GridFS :", diskError.message);
    return saveMenuPdfToGridFs(buffer, { fileName: file.name });
  }
}

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
