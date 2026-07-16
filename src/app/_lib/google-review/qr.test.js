import { afterEach, describe, expect, it } from "vitest";

import {
  GOOGLE_REVIEW_QR_PNG_FILENAME,
  GOOGLE_REVIEW_QR_SVG_FILENAME,
  GOOGLE_REVIEW_QR_PNG_SIZE,
  REVIEW_QR_BRAND,
  generateGoogleReviewQrPng,
  generateGoogleReviewQrPngCompact,
  generateGoogleReviewQrSvg,
  getGoogleReviewQrPayload,
} from "./qr";

const ORIGINAL_SITE = process.env.SITE_URL;
const ORIGINAL_PUBLIC = process.env.NEXT_PUBLIC_SITE_URL;
const ORIGINAL_GOOGLE = process.env.GOOGLE_REVIEW_URL;

afterEach(() => {
  if (ORIGINAL_SITE === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = ORIGINAL_SITE;

  if (ORIGINAL_PUBLIC === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_PUBLIC;

  if (ORIGINAL_GOOGLE === undefined) delete process.env.GOOGLE_REVIEW_URL;
  else process.env.GOOGLE_REVIEW_URL = ORIGINAL_GOOGLE;
});

describe("google review QR code", () => {
  it("encode uniquement l'URL permanente /avis-google", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://latablemarine.com";
    delete process.env.SITE_URL;

    const payload = getGoogleReviewQrPayload();
    expect(payload).toBe("https://latablemarine.com/avis-google");
    expect(payload).not.toContain("writereview");
    expect(payload).not.toContain("placeid");
  });

  it("génère un carton PNG brandé prêt à imprimer", async () => {
    process.env.SITE_URL = "https://latablemarine.com";
    const png = await generateGoogleReviewQrPng();
    expect(Buffer.isBuffer(png)).toBe(true);
    expect(png.length).toBeGreaterThan(8000);
    expect(png[0]).toBe(0x89);
    expect(png[1]).toBe(0x50);
    expect(GOOGLE_REVIEW_QR_PNG_FILENAME).toBe(
      "qr-avis-google-la-table-marine.png"
    );
  }, 30000);

  it("génère un SVG style présentoir avec la marque", async () => {
    process.env.SITE_URL = "https://latablemarine.com";
    const svg = await generateGoogleReviewQrSvg();
    expect(typeof svg).toBe("string");
    expect(svg).toContain("<svg");
    expect(svg).toContain("DONNEZ-NOUS VOTRE AVIS SUR");
    expect(svg).toContain("SCANNEZ POUR NOTER");
    expect(svg).toContain("latablemarine.com/avis-google");
    expect(svg).toContain(REVIEW_QR_BRAND.navyDark);
    expect(svg).toContain(REVIEW_QR_BRAND.star);
    expect(GOOGLE_REVIEW_QR_SVG_FILENAME).toBe(
      "qr-avis-google-la-table-marine.svg"
    );
  }, 30000);

  it("génère une variante PNG compacte", async () => {
    process.env.SITE_URL = "https://latablemarine.com";
    const png = await generateGoogleReviewQrPngCompact();
    expect(Buffer.isBuffer(png)).toBe(true);
    expect(png[0]).toBe(0x89);
    expect(GOOGLE_REVIEW_QR_PNG_SIZE).toBeGreaterThanOrEqual(1000);
  }, 20000);

  it("ne dépend pas de GOOGLE_REVIEW_URL pour le contenu encodé", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://latablemarine.com";
    process.env.GOOGLE_REVIEW_URL =
      "https://search.google.com/local/writereview?placeid=TEST";

    const payload = getGoogleReviewQrPayload();
    expect(payload).toBe("https://latablemarine.com/avis-google");
    expect(payload).not.toContain("TEST");
  });
});
