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

function isFileLike(file) {
  return file && typeof file.arrayBuffer === "function";
}

/**
 * @param {File} file
 * @param {{ maxBytes?: number }} options
 */
export async function saveUploadedImage(file, { maxBytes = 5 * 1024 * 1024 } = {}) {
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

/**
 * @param {File} file
 * @param {{ maxBytes?: number }} options
 */
export async function saveUploadedMenuPdf(
  file,
  { maxBytes = 15 * 1024 * 1024 } = {}
) {
  if (!isFileLike(file)) {
    throw new Error("INVALID_FILE");
  }

  if (file.type !== "application/pdf" && !file.name?.toLowerCase().endsWith(".pdf")) {
    throw new Error("INVALID_TYPE");
  }

  if (file.size > maxBytes) {
    throw new Error("FILE_TOO_LARGE");
  }

  const dir = path.join(process.cwd(), "public", "uploads", "menu");
  await fs.mkdir(dir, { recursive: true });

  const storedName = `menu-${Date.now()}.pdf`;
  const filepath = path.join(dir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  return {
    fileUrl: `/uploads/menu/${storedName}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: "application/pdf",
    // rétrocompatibilité
    url: `/uploads/menu/${storedName}`,
    filename: file.name,
    size: file.size,
  };
}
