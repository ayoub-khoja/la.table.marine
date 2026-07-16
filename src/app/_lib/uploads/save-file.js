import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const IMAGE_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** Limite upload serveur Vercel (~4,5 Mo). */
const DEFAULT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

function isFileLike(file) {
  return file && typeof file.arrayBuffer === "function";
}

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function saveImageToLocal(file, ext) {
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await fs.mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  return {
    url: `/uploads/products/${filename}`,
    filename: file.name,
    size: file.size,
  };
}

async function saveImageToBlob(file, ext) {
  const pathname = `uploads/products/${randomUUID()}${ext}`;
  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type,
  });

  return {
    url: blob.url,
    filename: file.name,
    size: file.size,
  };
}

/**
 * @param {File} file
 * @param {{ maxBytes?: number }} options
 */
export async function saveUploadedImage(
  file,
  { maxBytes = DEFAULT_IMAGE_MAX_BYTES } = {}
) {
  if (!isFileLike(file)) {
    throw new Error("INVALID_FILE");
  }

  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("INVALID_TYPE");
  }

  if (file.size > maxBytes) {
    throw new Error("FILE_TOO_LARGE");
  }

  const ext = IMAGE_EXT[file.type] || ".jpg";

  if (useBlobStorage()) {
    return saveImageToBlob(file, ext);
  }

  return saveImageToLocal(file, ext);
}

/**
 * @deprecated Utiliser saveMenuPdfForStore (@library/menu/pdf-storage).
 * Conservé pour compatibilité ; validation PDF stricte incluse.
 * @param {File} file
 * @param {{ maxBytes?: number }} options
 */
export async function saveUploadedMenuPdf(
  file,
  { maxBytes = 15 * 1024 * 1024 } = {}
) {
  const { validateAndReadPdf } = await import("@library/menu/validate-pdf");
  const validated = await validateAndReadPdf(file, { maxBytes });

  const dir = path.join(process.cwd(), "public", "uploads", "menu");
  await fs.mkdir(dir, { recursive: true });

  const storedName = `menu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
  const filepath = path.join(dir, storedName);
  await fs.writeFile(filepath, validated.buffer);

  return {
    fileUrl: `/uploads/menu/${storedName}`,
    fileName: validated.originalFileName,
    fileSize: validated.fileSize,
    mimeType: "application/pdf",
    // rétrocompatibilité
    url: `/uploads/menu/${storedName}`,
    filename: validated.originalFileName,
    size: validated.fileSize,
  };
}
