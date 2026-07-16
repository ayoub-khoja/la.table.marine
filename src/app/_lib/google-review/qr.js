import { promises as fs } from "fs";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";

import { getPermanentGoogleReviewUrl } from "./public-url";
import { getQrCardFontFaceCss, renderTextPng } from "@library/shared/embed-font";

export {
  GOOGLE_REVIEW_QR_PNG_FILENAME,
  GOOGLE_REVIEW_QR_SVG_FILENAME,
} from "./constants";

/** Couleurs marque La Table Marine */
export const REVIEW_QR_BRAND = {
  navy: "#0B4F7A",
  navyDark: "#041E31",
  navyMid: "#083A5A",
  wave: "#1E7AAD",
  waveLight: "#7EC8EF",
  sand: "#F7F4EF",
  gold: "#D4B896",
  star: "#F5C542",
  white: "#FFFFFF",
  muted: "#8BAFC4",
};

const LOGO_WHITE = path.join("public", "img", "logo-blanc.png");

const CARD_WIDTH = 900;
const CARD_HEIGHT = 1180;
const QR_SIZE = 480;
const LOGO_W = 620;
const LOGO_H = 200;

const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
};

/** Cache assets. */
const assetCache = new Map();

/** Contenu exact du QR — URL permanente /avis-google uniquement. */
export function getGoogleReviewQrPayload() {
  return getPermanentGoogleReviewUrl();
}

/**
 * @param {string} svg
 */
function parseQrSvg(svg) {
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 100 100";
  const inner = svg
    .replace(/^<\?xml[^>]*>\s*/i, "")
    .replace(/<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "");
  return { viewBox, inner };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string} filePath
 * @param {number} width
 * @param {number} height
 */
async function getLogoDataUri(filePath, width, height) {
  const cacheKey = `logo:${filePath}:${width}:${height}`;
  if (assetCache.has(cacheKey)) {
    return assetCache.get(cacheKey);
  }

  const promise = (async () => {
    const absolute = path.join(process.cwd(), filePath);
    const buffer = await fs.readFile(absolute);
    const resized = await sharp(buffer)
      .resize(width, height, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    return `data:image/png;base64,${resized.toString("base64")}`;
  })();

  assetCache.set(cacheKey, promise);
  return promise;
}

async function safeLogoDataUri(width, height) {
  try {
    return await getLogoDataUri(LOGO_WHITE, width, height);
  } catch (error) {
    console.error("[google-review/qr] logo skipped:", error?.message || error);
    return null;
  }
}

/**
 * Coins type viewfinder autour du QR.
 */
function viewfinderMarkup(x, y, size, color, len = 48, stroke = 5) {
  const right = x + size;
  const bottom = y + size;
  return `
    <g fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round">
      <path d="M${x} ${y + len} V${y} H${x + len}"/>
      <path d="M${right - len} ${y} H${right} V${y + len}"/>
      <path d="M${x} ${bottom - len} V${bottom} H${x + len}"/>
      <path d="M${right - len} ${bottom} H${right} V${bottom - len}"/>
    </g>
  `;
}

/**
 * Étoiles dorées (5).
 * @param {number} cx
 * @param {number} y
 * @param {number} starSize
 * @param {number} gap
 */
function starsMarkup(cx, y, starSize = 36, gap = 14) {
  const total = 5 * starSize + 4 * gap;
  const startX = cx - total / 2;
  const points = (ox, oy, r) => {
    const coords = [];
    for (let i = 0; i < 5; i++) {
      const a = (-Math.PI / 2) + (i * 2 * Math.PI) / 5;
      const b = a + Math.PI / 5;
      coords.push(
        `${ox + r * Math.cos(a)},${oy + r * Math.sin(a)}`,
        `${ox + r * 0.42 * Math.cos(b)},${oy + r * 0.42 * Math.sin(b)}`
      );
    }
    return coords.join(" ");
  };

  let markup = "";
  for (let i = 0; i < 5; i++) {
    const ox = startX + i * (starSize + gap) + starSize / 2;
    const oy = y + starSize / 2;
    markup += `<polygon points="${points(ox, oy, starSize / 2)}" fill="${REVIEW_QR_BRAND.star}"/>`;
  }
  return markup;
}

/**
 * Mot « Google » stylisé aux couleurs marque (pas le logo officiel Google).
 * @param {number} cx
 * @param {number} y
 */
function googleWordMarkup(cx, y) {
  const letters = [
    { ch: "G", color: REVIEW_QR_BRAND.waveLight },
    { ch: "o", color: REVIEW_QR_BRAND.gold },
    { ch: "o", color: REVIEW_QR_BRAND.star },
    { ch: "g", color: REVIEW_QR_BRAND.wave },
    { ch: "l", color: REVIEW_QR_BRAND.sand },
    { ch: "e", color: REVIEW_QR_BRAND.gold },
  ];
  const fontSize = 58;
  const charW = 40;
  const startX = cx - (letters.length * charW) / 2 + charW / 2;

  return letters
    .map(
      (letter, i) =>
        `<text x="${startX + i * charW}" y="${y}" text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800"
          fill="${letter.color}">${letter.ch}</text>`
    )
    .join("\n");
}

/**
 * Barre multicolore marque (équivalent de la barre Google du design).
 * @param {number} y
 * @param {number} height
 */
function brandBarMarkup(y, height = 10) {
  const colors = [
    REVIEW_QR_BRAND.wave,
    REVIEW_QR_BRAND.gold,
    REVIEW_QR_BRAND.star,
    REVIEW_QR_BRAND.waveLight,
  ];
  const seg = CARD_WIDTH / colors.length;
  return colors
    .map(
      (color, i) =>
        `<rect x="${i * seg}" y="${y}" width="${seg}" height="${height}" fill="${color}"/>`
    )
    .join("\n");
}

/**
 * Carton avis Google — design type presentoir, couleurs La Table Marine.
 * Encode uniquement /avis-google.
 * @returns {Promise<string>}
 */
export async function generateGoogleReviewQrSvg() {
  const payload = getGoogleReviewQrPayload();
  const logoUri = await safeLogoDataUri(LOGO_W, LOGO_H);
  const fontFaceCss = await getQrCardFontFaceCss();
  const cx = CARD_WIDTH / 2;

  const qrSvg = await QRCode.toString(payload, {
    ...QR_OPTIONS,
    type: "svg",
    width: QR_SIZE,
    margin: 2,
  });
  const { viewBox, inner: qrInner } = parseQrSvg(qrSvg);

  const qrX = (CARD_WIDTH - QR_SIZE) / 2;
  const qrY = 340;
  const framePad = 24;
  const frameX = qrX - framePad;
  const frameY = qrY - framePad;
  const frameSize = QR_SIZE + framePad * 2;
  const frameBottom = frameY + frameSize;
  const logoY = frameBottom + 70;
  const urlY = CARD_HEIGHT - 28;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img"
  aria-label="QR code avis Google La Table Marine">
  <defs>
    <style type="text/css"><![CDATA[
      ${fontFaceCss}
      text { font-family: QRCard, DejaVu Sans, sans-serif; }
    ]]></style>
  </defs>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${REVIEW_QR_BRAND.navyDark}"/>
  <rect x="0" y="0" width="${CARD_WIDTH}" height="280" fill="${REVIEW_QR_BRAND.navyMid}" opacity="0.45"/>

  <text x="${cx}" y="72" text-anchor="middle"
    font-size="28" font-weight="700"
    fill="${REVIEW_QR_BRAND.sand}" letter-spacing="3">DONNEZ-NOUS VOTRE AVIS SUR</text>

  ${googleWordMarkup(cx, 145)}
  ${starsMarkup(cx, 175, 34, 12)}
  ${brandBarMarkup(250, 8)}

  <rect x="${frameX}" y="${frameY}" width="${frameSize}" height="${frameSize}"
    rx="12" fill="${REVIEW_QR_BRAND.white}"/>
  <svg x="${qrX}" y="${qrY}" width="${QR_SIZE}" height="${QR_SIZE}" viewBox="${viewBox}">
    ${qrInner}
  </svg>
  ${viewfinderMarkup(frameX - 12, frameY - 12, frameSize + 24, REVIEW_QR_BRAND.white, 44, 5)}

  <text x="${cx}" y="${frameBottom + 42}" text-anchor="middle"
    font-size="24" font-weight="700"
    fill="${REVIEW_QR_BRAND.white}" letter-spacing="3">SCANNEZ POUR NOTER</text>

  ${
    logoUri
      ? `<image xlink:href="${logoUri}" href="${logoUri}"
    x="${(CARD_WIDTH - LOGO_W) / 2}" y="${logoY}" width="${LOGO_W}" height="${LOGO_H}" preserveAspectRatio="xMidYMid meet"/>`
      : `<text x="${cx}" y="${logoY + 90}" text-anchor="middle"
    font-size="36" font-weight="700"
    fill="${REVIEW_QR_BRAND.sand}">LA TABLE MARINE</text>`
  }

  <text x="${cx}" y="${urlY}" text-anchor="middle"
    font-size="16" font-weight="600"
    fill="${REVIEW_QR_BRAND.muted}" letter-spacing="1">${escapeXml(
      payload.replace(/^https?:\/\//, "")
    )}</text>
</svg>`;
}

/**
 * PNG carton brandé — composition Sharp + police embarquée (Vercel).
 * @returns {Promise<Buffer>}
 */
export async function generateGoogleReviewQrPng() {
  const payload = getGoogleReviewQrPayload();
  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;

  const qrSize = QR_SIZE;
  const qrX = Math.round((W - qrSize) / 2);
  const qrY = 340;
  const framePad = 24;
  const frameSize = qrSize + framePad * 2;
  const frameX = qrX - framePad;
  const frameY = qrY - framePad;
  const frameBottom = frameY + frameSize;
  const logoY = frameBottom + 55;

  const [
    headerPng,
    googlePng,
    starsPng,
    barPng,
    instructPng,
    urlPng,
    qrPng,
    logoPng,
    viewfinderPng,
  ] = await Promise.all([
    renderTextPng("DONNEZ-NOUS VOTRE AVIS SUR", {
      fontSize: 28,
      color: REVIEW_QR_BRAND.sand,
      width: W,
      height: 48,
      letterSpacing: 3,
    }),
    (async () => {
      const fontFace = await getQrCardFontFaceCss();
      const letters = [
        { ch: "G", color: REVIEW_QR_BRAND.waveLight },
        { ch: "o", color: REVIEW_QR_BRAND.gold },
        { ch: "o", color: REVIEW_QR_BRAND.star },
        { ch: "g", color: REVIEW_QR_BRAND.wave },
        { ch: "l", color: REVIEW_QR_BRAND.sand },
        { ch: "e", color: REVIEW_QR_BRAND.gold },
      ];
      const charW = 40;
      const startX = W / 2 - (letters.length * charW) / 2 + charW / 2;
      const body = letters
        .map(
          (letter, i) =>
            `<text x="${startX + i * charW}" y="48" text-anchor="middle"
              font-family="QRCard, DejaVu Sans, sans-serif" font-size="58" font-weight="800"
              fill="${letter.color}">${letter.ch}</text>`
        )
        .join("");
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="70">
  <defs><style type="text/css"><![CDATA[${fontFace}]]></style></defs>
  ${body}
</svg>`;
      return sharp(Buffer.from(svg, "utf8"))
        .resize(W, 70, { fit: "fill" })
        .png()
        .toBuffer();
    })(),
    (async () => {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="50">
  ${starsMarkup(W / 2, 5, 34, 12)}
</svg>`;
      return sharp(Buffer.from(svg)).png().toBuffer();
    })(),
    (async () => {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="12">
  ${brandBarMarkup(0, 8)}
</svg>`;
      return sharp(Buffer.from(svg)).png().toBuffer();
    })(),
    renderTextPng("SCANNEZ POUR NOTER", {
      fontSize: 24,
      color: REVIEW_QR_BRAND.white,
      width: W,
      height: 40,
      letterSpacing: 3,
    }),
    renderTextPng(payload.replace(/^https?:\/\//, ""), {
      fontSize: 16,
      color: REVIEW_QR_BRAND.muted,
      width: W,
      height: 32,
      letterSpacing: 1,
      fontWeight: 600,
    }),
    QRCode.toBuffer(payload, {
      ...QR_OPTIONS,
      type: "png",
      width: qrSize,
      margin: 2,
    }),
    (async () => {
      try {
        const absolute = path.join(process.cwd(), LOGO_WHITE);
        const buffer = await fs.readFile(absolute);
        return sharp(buffer)
          .resize(LOGO_W, LOGO_H, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
      } catch {
        return null;
      }
    })(),
    (async () => {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${viewfinderMarkup(frameX - 12, frameY - 12, frameSize + 24, REVIEW_QR_BRAND.white, 44, 5)}
</svg>`;
      return sharp(Buffer.from(svg)).png().toBuffer();
    })(),
  ]);

  /** @type {import("sharp").OverlayOptions[]} */
  const layers = [
    { input: headerPng, left: 0, top: 36 },
    { input: googlePng, left: 0, top: 95 },
    { input: starsPng, left: 0, top: 175 },
    { input: barPng, left: 0, top: 250 },
    {
      input: await sharp({
        create: {
          width: frameSize,
          height: frameSize,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer(),
      left: frameX,
      top: frameY,
    },
    { input: qrPng, left: qrX, top: qrY },
    { input: viewfinderPng, left: 0, top: 0 },
    { input: instructPng, left: 0, top: frameBottom + 18 },
  ];

  if (logoPng) {
    layers.push({
      input: logoPng,
      left: Math.round((W - LOGO_W) / 2),
      top: logoY,
    });
  }

  layers.push({ input: urlPng, left: 0, top: H - 40 });

  return sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: { r: 4, g: 30, b: 49 },
    },
  })
    .composite(layers)
    .png({ compressionLevel: 8 })
    .toBuffer();
}

/**
 * Variante compacte : QR seul (carré).
 * @returns {Promise<Buffer>}
 */
export async function generateGoogleReviewQrPngCompact() {
  return QRCode.toBuffer(getGoogleReviewQrPayload(), {
    ...QR_OPTIONS,
    type: "png",
    width: 1000,
    margin: 3,
  });
}

/** @returns {Promise<string>} SVG QR seul (pas le carton). */
export async function generateGoogleReviewQrSvgPlain() {
  return QRCode.toString(getGoogleReviewQrPayload(), {
    ...QR_OPTIONS,
    type: "svg",
    width: 1000,
    margin: 3,
  });
}

export const GOOGLE_REVIEW_QR_PNG_SIZE = 1000;
export const GOOGLE_REVIEW_QR_CARD_WIDTH = CARD_WIDTH;
export const GOOGLE_REVIEW_QR_CARD_HEIGHT = CARD_HEIGHT;
