import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

/** @type {Map<string, string>} */
const fontBase64Cache = new Map();

/**
 * Polices embarquées dans le repo (fiable sur Vercel, pas de tracing node_modules).
 * @param {"regular" | "bold"} weight
 */
function getBundledFontPath(weight = "bold") {
  const fileName =
    weight === "bold" ? "DejaVuSans-Bold.ttf" : "DejaVuSans.ttf";
  return path.join(
    process.cwd(),
    "src",
    "app",
    "_lib",
    "shared",
    "fonts",
    fileName
  );
}

/**
 * Charge une police DejaVu en base64 (embarquée pour Sharp/librsvg sur Vercel).
 * @param {"regular" | "bold"} weight
 */
export async function getDejaVuFontBase64(weight = "bold") {
  if (fontBase64Cache.has(weight)) {
    return fontBase64Cache.get(weight);
  }

  const buffer = await fs.readFile(getBundledFontPath(weight));
  const base64 = buffer.toString("base64");
  fontBase64Cache.set(weight, base64);
  return base64;
}

/**
 * CSS @font-face pour SVG rasterisés par Sharp.
 * @returns {Promise<string>}
 */
export async function getQrCardFontFaceCss() {
  const [bold, regular] = await Promise.all([
    getDejaVuFontBase64("bold"),
    getDejaVuFontBase64("regular"),
  ]);

  return `
@font-face {
  font-family: "QRCard";
  font-weight: 700;
  font-style: normal;
  src: url("data:font/ttf;base64,${bold}") format("truetype");
}
@font-face {
  font-family: "QRCard";
  font-weight: 400;
  font-style: normal;
  src: url("data:font/ttf;base64,${regular}") format("truetype");
}
`.trim();
}

/**
 * Rasterise un libellé en PNG transparent (police embarquée).
 * @param {string} text
 * @param {{
 *   fontSize: number,
 *   color: string,
 *   width: number,
 *   height: number,
 *   fontWeight?: number,
 *   letterSpacing?: number,
 * }} options
 */
export async function renderTextPng(
  text,
  {
    fontSize,
    color,
    width,
    height,
    fontWeight = 700,
    letterSpacing = 0,
  }
) {
  const fontFace = await getQrCardFontFaceCss();
  const escaped = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <style type="text/css"><![CDATA[
      ${fontFace}
    ]]></style>
  </defs>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
    font-family="QRCard, DejaVu Sans, sans-serif"
    font-size="${fontSize}" font-weight="${fontWeight}"
    letter-spacing="${letterSpacing}" fill="${color}">${escaped}</text>
</svg>`;

  return sharp(Buffer.from(svg, "utf8"))
    .resize(width, height, { fit: "fill" })
    .png()
    .toBuffer();
}
