import { describe, expect, it } from "vitest";

import { CARTE_MENU_MAX_BYTES } from "./model";
import {
  hasPdfMagicBytes,
  sanitizeOriginalFileName,
  validateAndReadPdf,
} from "./validate-pdf";

function makeFile({
  name = "menu.pdf",
  type = "application/pdf",
  content = "%PDF-1.4\n%",
} = {}) {
  const buffer = Buffer.from(content, "utf8");
  return {
    name,
    type,
    size: buffer.length,
    arrayBuffer: async () =>
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  };
}

describe("validate-pdf", () => {
  it("accepte un PDF valide", async () => {
    const result = await validateAndReadPdf(makeFile());
    expect(result.mimeType).toBe("application/pdf");
    expect(result.originalFileName).toBe("menu.pdf");
    expect(result.fileSize).toBeGreaterThan(0);
    expect(hasPdfMagicBytes(result.buffer)).toBe(true);
  });

  it("refuse un fichier non PDF (image renommée)", async () => {
    await expect(
      validateAndReadPdf(
        makeFile({
          name: "fake.pdf",
          type: "application/pdf",
          content: "\x89PNG\r\n\x1a\n",
        })
      )
    ).rejects.toThrow("INVALID_TYPE");
  });

  it("refuse un type MIME non autorisé", async () => {
    await expect(
      validateAndReadPdf(
        makeFile({
          name: "menu.exe",
          type: "application/x-msdownload",
          content: "%PDF-1.4",
        })
      )
    ).rejects.toThrow("INVALID_TYPE");
  });

  it("refuse un fichier vide", async () => {
    await expect(
      validateAndReadPdf({
        name: "empty.pdf",
        type: "application/pdf",
        size: 0,
        arrayBuffer: async () => new ArrayBuffer(0),
      })
    ).rejects.toThrow("EMPTY_FILE");
  });

  it("refuse un PDF trop volumineux", async () => {
    const oversized = {
      name: "huge.pdf",
      type: "application/pdf",
      size: CARTE_MENU_MAX_BYTES + 1,
      arrayBuffer: async () => new ArrayBuffer(8),
    };

    await expect(validateAndReadPdf(oversized)).rejects.toThrow("FILE_TOO_LARGE");
  });

  it("nettoie les noms de fichiers dangereux", () => {
    expect(sanitizeOriginalFileName("../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(sanitizeOriginalFileName("menu<script>.pdf")).toBe("menu_script_.pdf");
    expect(sanitizeOriginalFileName("carte")).toBe("carte.pdf");
  });
});
