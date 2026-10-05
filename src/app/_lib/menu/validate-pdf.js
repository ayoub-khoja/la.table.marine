import path from "path";

import { CARTE_MENU_MAX_BYTES, CARTE_MENU_MIME } from "@library/menu/model";

const PDF_MAGIC = Buffer.from("%PDF-", "ascii");

/**
 * @param {unknown} file
 */
export function isFileLike(file) {
  return Boolean(file && typeof file === "object" && typeof file.arrayBuffer === "function");
}

/**
 * Nettoie le nom original (pas de chemin, caractères dangereux).
 * @param {string} [name]
 */
export function sanitizeOriginalFileName(name) {
  const base = path.basename(String(name || "menu.pdf")).replace(/\0/g, "");
  const cleaned = base
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);

  if (!cleaned.toLowerCase().endsWith(".pdf")) {
    return `${cleaned || "menu"}.pdf`;
  }

  return cleaned || "menu.pdf";
}

/**
 * Vérifie la signature réelle `%PDF-`.
 * @param {Buffer | Uint8Array} buffer
 */
export function hasPdfMagicBytes(buffer) {
  if (!buffer || buffer.length < PDF_MAGIC.length) {
    return false;
  }

  for (let i = 0; i < PDF_MAGIC.length; i += 1) {
    if (buffer[i] !== PDF_MAGIC[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Validation stricte d'un fichier PDF avant import.
 * @param {File | (Blob & { name?: string; type?: string; size?: number })} file
 * @param {{ maxBytes?: number }} [options]
 * @returns {Promise<{ buffer: Buffer, originalFileName: string, mimeType: string, fileSize: number }>}
 */
export async function validateAndReadPdf(file, { maxBytes = CARTE_MENU_MAX_BYTES } = {}) {
  if (!isFileLike(file)) {
    throw new Error("INVALID_FILE");
  }

  const size = Number(file.size) || 0;
  if (size <= 0) {
    throw new Error("EMPTY_FILE");
  }

  if (size > maxBytes) {
    throw new Error("FILE_TOO_LARGE");
  }

  const originalFileName = sanitizeOriginalFileName(file.name);
  const hasPdfExtension = originalFileName.toLowerCase().endsWith(".pdf");
  const mime = String(file.type || "").toLowerCase();
  const mimeAllowed =
    !mime || mime === CARTE_MENU_MIME || mime === "application/octet-stream";

  if (!hasPdfExtension || !mimeAllowed) {
    throw new Error("INVALID_TYPE");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length === 0) {
    throw new Error("EMPTY_FILE");
  }

  if (buffer.length > maxBytes) {
    throw new Error("FILE_TOO_LARGE");
  }

  if (!hasPdfMagicBytes(buffer)) {
    throw new Error("INVALID_TYPE");
  }

  return {
    buffer,
    originalFileName,
    mimeType: CARTE_MENU_MIME,
    fileSize: buffer.length,
  };
}
