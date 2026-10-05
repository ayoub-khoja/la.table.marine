import { promises as fs } from "fs";
import path from "path";
import * as OpenTypeNS from "opentype.js";
import sharp from "sharp";

/** @type {Map<string, import("opentype.js").Font>} */
const fontCache = new Map();

/**
 * Interop CJS/ESM — sous Next/Webpack `import opentype from` peut être undefined.
 * @returns {{ parse: (buf: ArrayBuffer) => import("opentype.js").Font }}
 */
function getOpenType() {
  const mod = OpenTypeNS;
  if (mod && typeof mod.parse === "function") {
    return mod;
  }
  if (mod?.default && typeof mod.default.parse === "function") {
    return mod.default;
  }
  // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
  const required = require("opentype.js");
  if (required && typeof required.parse === "function") {
    return required;
  }
  if (required?.default && typeof required.default.parse === "function") {
    return required.default;
  }
  throw new Error("Impossible de charger opentype.js");
}

/**
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
 * @param {Buffer} nodeBuffer
 * @returns {ArrayBuffer}
 */
function toArrayBuffer(nodeBuffer) {
  return nodeBuffer.buffer.slice(
    nodeBuffer.byteOffset,
    nodeBuffer.byteOffset + nodeBuffer.byteLength
  );
}

/**
 * @param {"regular" | "bold"} weight
 * @returns {Promise<import("opentype.js").Font>}
 */
async function loadFont(weight = "bold") {
  if (fontCache.has(weight)) {
    return fontCache.get(weight);
  }

  const fontPath = getBundledFontPath(weight);
  const nodeBuffer = await fs.readFile(fontPath);
  const opentype = getOpenType();
  const font = opentype.parse(toArrayBuffer(nodeBuffer));

  const testGlyph = font.charToGlyph("A");
  if (!testGlyph || testGlyph.index === 0 || testGlyph.name === ".notdef") {
    throw new Error(`Police invalide: ${fontPath}`);
  }

  fontCache.set(weight, font);
  return font;
}

/**
 * Convertit un texte en paths SVG puis PNG (aucune police système).
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
  const font = await loadFont(fontWeight >= 700 ? "bold" : "regular");
  const chars = Array.from(String(text));

  /** @type {{ glyph: import("opentype.js").Glyph | null, advance: number }[]} */
  const items = [];
  let totalWidth = 0;

  for (const char of chars) {
    if (char === " ") {
      const spaceAdv = fontSize * 0.35;
      items.push({ glyph: null, advance: spaceAdv });
      totalWidth += spaceAdv;
      continue;
    }

    const glyph = font.charToGlyph(char);
    if (!glyph || glyph.index === 0 || glyph.name === ".notdef") {
      throw new Error(`Glyphe manquant pour « ${char} » (U+${char.codePointAt(0).toString(16)})`);
    }

    const advance = glyph.advanceWidth * (fontSize / font.unitsPerEm);
    items.push({ glyph, advance });
    totalWidth += advance;
  }

  if (chars.length > 1) {
    totalWidth += letterSpacing * (chars.length - 1);
  }

  const startX = Math.max(4, (width - totalWidth) / 2);
  const baseline = height * 0.72;

  /** @type {string[]} */
  const paths = [];
  let x = startX;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.glyph) {
      const glyphPath = item.glyph.getPath(x, baseline, fontSize);
      const d = glyphPath.toPathData(1);
      if (d && d.length > 4) {
        paths.push(`<path d="${d}" fill="${color}"/>`);
      }
    }
    x += item.advance;
    if (i < items.length - 1) x += letterSpacing;
  }

  if (paths.length === 0) {
    throw new Error(`Aucun glyphe rendu pour: "${text}"`);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${paths.join("\n  ")}
</svg>`;

  return sharp(Buffer.from(svg, "utf8")).png().toBuffer();
}

/**
 * @returns {Promise<string>}
 */
export async function getQrCardFontFaceCss() {
  const [boldBuf, regularBuf] = await Promise.all([
    fs.readFile(getBundledFontPath("bold")),
    fs.readFile(getBundledFontPath("regular")),
  ]);

  return `
@font-face {
  font-family: "QRCard";
  font-weight: 700;
  font-style: normal;
  src: url("data:font/ttf;base64,${boldBuf.toString("base64")}") format("truetype");
}
@font-face {
  font-family: "QRCard";
  font-weight: 400;
  font-style: normal;
  src: url("data:font/ttf;base64,${regularBuf.toString("base64")}") format("truetype");
}
`.trim();
}

export { loadFont, getBundledFontPath };
