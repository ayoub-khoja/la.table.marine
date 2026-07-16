import { afterEach, describe, expect, it } from "vitest";

import {
  MENU_QR_PNG_FILENAME,
  MENU_QR_SVG_FILENAME,
  QR_BRAND,
  generateMenuQrPng,
  generateMenuQrPngCompact,
  generateMenuQrSvg,
  getMenuQrPayload,
} from "./qr";

const ORIGINAL_SITE = process.env.SITE_URL;
const ORIGINAL_PUBLIC = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL_SITE === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = ORIGINAL_SITE;

  if (ORIGINAL_PUBLIC === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_PUBLIC;
});

describe("menu QR code", () => {
  it("encode uniquement l'URL permanente /menu", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://latablemarine.com";
    delete process.env.SITE_URL;

    const payload = getMenuQrPayload();
    expect(payload).toBe("https://latablemarine.com/menu");
    expect(payload).not.toContain(".pdf");
    expect(payload).not.toContain("gridfs");
    expect(payload).not.toContain("X-Amz");
    expect(payload).not.toContain("token=");
  });

  it("génère un carton PNG brandé haute résolution", async () => {
    process.env.SITE_URL = "https://latablemarine.com";
    const png = await generateMenuQrPng();
    expect(Buffer.isBuffer(png)).toBe(true);
    expect(png.length).toBeGreaterThan(5000);
    expect(png[0]).toBe(0x89);
    expect(png[1]).toBe(0x50);
    expect(png[2]).toBe(0x4e);
    expect(png[3]).toBe(0x47);
    expect(MENU_QR_PNG_FILENAME).toBe("qr-menu-la-table-marine.png");
  }, 20000);

  it("génère un SVG brandé avec le nom et le logo", async () => {
    process.env.SITE_URL = "https://latablemarine.com";
    const svg = await generateMenuQrSvg();
    expect(typeof svg).toBe("string");
    expect(svg).toContain("<svg");
    expect(svg).toContain("LA TABLE MARINE");
    expect(svg).toContain("Scannez pour découvrir la carte");
    expect(svg).toContain("latablemarine.com/menu");
    expect(svg).toContain("data:image/png;base64,");
    expect(svg).toContain(QR_BRAND.navy);
    expect(MENU_QR_SVG_FILENAME).toBe("qr-menu-la-table-marine.svg");
  }, 20000);

  it("génère une variante PNG compacte avec logo central", async () => {
    process.env.SITE_URL = "https://latablemarine.com";
    const png = await generateMenuQrPngCompact();
    expect(Buffer.isBuffer(png)).toBe(true);
    expect(png[0]).toBe(0x89);
  }, 20000);

  it("reste identique après un remplacement fictif de PDF", () => {
    process.env.SITE_URL = "https://latablemarine.com";
    const beforeReplace = getMenuQrPayload();
    const afterReplace = getMenuQrPayload();
    expect(afterReplace).toBe(beforeReplace);
    expect(afterReplace).toBe("https://latablemarine.com/menu");
  });
});
