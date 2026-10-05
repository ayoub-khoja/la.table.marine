import { promises as fs } from "fs";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";

import { getPermanentMenuUrl } from "@library/menu/public-url";
import { getQrCardFontFaceCss, renderTextPng } from "@library/shared/embed-font";

export const MENU_QR_PNG_FILENAME = "qr-menu-la-table-marine.png";
export const MENU_QR_SVG_FILENAME = "qr-menu-la-table-marine.svg";

/** Couleurs marque La Table Marine */
export const QR_BRAND = {
  navy: "#0B4F7A",
  navyDark: "#041E31",
  navyMid: "#083A5A",
  wave: "#1E7AAD",
  waveLight: "#7EC8EF",
  sand: "#F7F4EF",
  gold: "#D4B896",
  white: "#FFFFFF",
  ink: "#12263A",
  muted: "#8BAFC4",
  scan: "#4ECDC4",
};

const LOGO_ICON = path.join("public", "img", "logo-sans-texte.png");
const LOGO_WHITE = path.join("public", "img", "logo-blanc.png");
const FISH_MINIMAL_SVG = path.join("public", "img", "qr", "poisson-minimal.svg");
const MUSSEL_MINIMAL_IMAGE = path.join("public", "img", "qr", "moule-minimal.png");

const CARD_SCALE = 0.72;
const CARD_WIDTH = Math.round(1200 * CARD_SCALE);
const CARD_HEIGHT = Math.round(1480 * CARD_SCALE);

/** @param {number} value */
function sc(value) {
  return Math.round(value * CARD_SCALE);
}

const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
};

/** Cache logos traités. */
const logoCache = new Map();

/**
 * Contenu exact du QR — URL permanente uniquement.
 */
export function getMenuQrPayload() {
  return getPermanentMenuUrl();
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

/**
 * @param {Buffer} input
 * @returns {Promise<Buffer>}
 */
async function makeBlackBackgroundTransparent(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 40 && g < 40 && b < 40) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

/**
 * @param {Buffer} input
 * @returns {Promise<Buffer>}
 */
async function makeWhiteBackgroundTransparent(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 235 && g > 235 && b > 235) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

/**
 * @param {Buffer} input
 * @returns {Promise<Buffer>}
 */
async function makeDarkBackgroundTransparent(input, { maxLuminance = 90 } = {}) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < maxLuminance) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

function sanitizeSvgContent(svg) {
  return String(svg)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * @param {string} filePath
 * @param {number} width
 * @param {number} height
 * @param {{ transparentWhite?: boolean, transparentDark?: boolean }} [options]
 */
async function getImageDataUri(
  filePath,
  width,
  height,
  { transparentWhite = false, transparentDark = false } = {}
) {
  const cacheKey = `img:${filePath}:${width}:${height}:${transparentWhite}:${transparentDark}`;
  if (logoCache.has(cacheKey)) {
    return logoCache.get(cacheKey);
  }

  const promise = (async () => {
    const absolute = path.join(process.cwd(), filePath);
    let buffer = await fs.readFile(absolute);
    const isSvg = filePath.toLowerCase().endsWith(".svg");

    let pipeline = isSvg
      ? sharp(Buffer.from(sanitizeSvgContent(buffer.toString("utf8"))), {
          density: 300,
        })
      : sharp(buffer);

    if (!isSvg && transparentWhite) {
      buffer = await makeWhiteBackgroundTransparent(await pipeline.png().toBuffer());
      pipeline = sharp(buffer);
    }

    if (!isSvg && transparentDark) {
      buffer = await makeDarkBackgroundTransparent(await pipeline.png().toBuffer());
      pipeline = sharp(buffer);
    }

    const png = await pipeline
      .resize(width, height, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    return `data:image/png;base64,${png.toString("base64")}`;
  })();

  logoCache.set(cacheKey, promise);
  return promise;
}

/**
 * @param {string} filePath
 * @param {number} size
 * @param {{ transparentBlack?: boolean }} [options]
 */
async function getLogoDataUri(filePath, size, { transparentBlack = false } = {}) {
  const cacheKey = `${filePath}:${size}:${transparentBlack}`;
  if (logoCache.has(cacheKey)) {
    return logoCache.get(cacheKey);
  }

  const promise = (async () => {
    const absolute = path.join(process.cwd(), filePath);
    let buffer = await fs.readFile(absolute);

    if (transparentBlack) {
      buffer = await makeBlackBackgroundTransparent(buffer);
    }

    const resized = await sharp(buffer)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    return `data:image/png;base64,${resized.toString("base64")}`;
  })();

  logoCache.set(cacheKey, promise);
  return promise;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Coins type viewfinder autour du QR.
 */
function viewfinderMarkup(x, y, size, color, len = 56, stroke = 5) {
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
 * Carton QR prêt à imprimer — style scan professionnel.
 * @returns {Promise<string>}
 */
/**
 * Charge une image décorative sans faire échouer tout le QR si le fichier manque.
 * @param {() => Promise<string>} loader
 */
async function safeDataUri(loader) {
  try {
    return await loader();
  } catch (error) {
    console.error("[menu/qr] asset skipped:", error?.message || error);
    return null;
  }
}

export async function generateMenuQrSvg() {
  const payload = getMenuQrPayload();
  const cx = CARD_WIDTH / 2;
  const fontFaceCss = await getQrCardFontFaceCss();
  const logoWhiteUri = await safeDataUri(() => getLogoDataUri(LOGO_WHITE, sc(900)));
  const fishUri = await safeDataUri(() =>
    getImageDataUri(FISH_MINIMAL_SVG, sc(190), sc(114))
  );
  const musselUri = await safeDataUri(() =>
    getImageDataUri(MUSSEL_MINIMAL_IMAGE, sc(175), sc(175), {
      transparentDark: true,
    })
  );

  const qrSvg = await QRCode.toString(payload, {
    ...QR_OPTIONS,
    type: "svg",
    width: sc(720),
    margin: 2,
  });

  const { viewBox, inner: qrInner } = parseQrSvg(qrSvg);

  const qrSize = sc(720);
  const qrX = (CARD_WIDTH - qrSize) / 2;
  const qrY = sc(260);
  const framePad = sc(32);
  const qrFrameBottom = qrY + qrSize + framePad;
  const logoY = sc(1120);
  const logoW = sc(900);
  const logoH = sc(300);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img"
  aria-label="QR code menu La Table Marine">
  <defs>
    <style type="text/css"><![CDATA[
      ${fontFaceCss}
      text { font-family: QRCard, DejaVu Sans, sans-serif; }
    ]]></style>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${QR_BRAND.navyDark}"/>
      <stop offset="55%" stop-color="${QR_BRAND.navyMid}"/>
      <stop offset="100%" stop-color="${QR_BRAND.navyDark}"/>
    </linearGradient>
  </defs>

  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#bg)"/>

  <g opacity="0.08" fill="none" stroke="${QR_BRAND.waveLight}" stroke-width="2">
    <path d="M0 ${sc(1360)} C${sc(200)} ${sc(1310)} ${sc(400)} ${sc(1410)} ${cx} ${sc(1360)} S${sc(1000)} ${sc(1310)} ${CARD_WIDTH} ${sc(1360)}"/>
    <path d="M0 ${sc(1410)} C${sc(200)} ${sc(1360)} ${sc(400)} ${sc(1460)} ${cx} ${sc(1410)} S${sc(1000)} ${sc(1360)} ${CARD_WIDTH} ${sc(1410)}"/>
  </g>

  <text x="${cx}" y="${sc(120)}" text-anchor="middle"
    font-size="${sc(84)}" font-weight="800"
    fill="${QR_BRAND.white}" letter-spacing="${sc(8)}">SCANNEZ</text>
  <text x="${cx}" y="${sc(175)}" text-anchor="middle"
    font-size="${sc(28)}" font-weight="700"
    fill="${QR_BRAND.waveLight}" letter-spacing="${sc(3)}">POUR ACCÉDER AU MENU DIGITAL</text>

  <rect x="${qrX - framePad}" y="${qrY - framePad}"
    width="${qrSize + framePad * 2}" height="${qrSize + framePad * 2}"
    rx="${sc(8)}" fill="${QR_BRAND.white}"/>

  <svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" viewBox="${viewBox}">
    ${qrInner}
  </svg>

  ${viewfinderMarkup(qrX - framePad - sc(16), qrY - framePad - sc(16), qrSize + framePad * 2 + sc(32), QR_BRAND.white, sc(56), sc(5))}

  <text x="${cx}" y="${qrFrameBottom + sc(40)}" text-anchor="middle"
    font-size="${sc(22)}" font-weight="700"
    fill="${QR_BRAND.white}" letter-spacing="2">DIRIGEZ VOTRE APPAREIL PHOTO</text>
  <text x="${cx}" y="${qrFrameBottom + sc(70)}" text-anchor="middle"
    font-size="${sc(22)}" font-weight="700"
    fill="${QR_BRAND.white}" letter-spacing="2">VERS LE QR CODE</text>

  ${
    fishUri
      ? `<image xlink:href="${fishUri}" href="${fishUri}"
    x="${sc(30)}" y="${sc(1140)}" width="${sc(190)}" height="${sc(114)}" opacity="0.98"/>`
      : ""
  }
  ${
    musselUri
      ? `<image xlink:href="${musselUri}" href="${musselUri}"
    x="${CARD_WIDTH - sc(30) - sc(175)}" y="${sc(1135)}" width="${sc(175)}" height="${sc(175)}" opacity="0.98"/>`
      : ""
  }
  ${
    logoWhiteUri
      ? `<image xlink:href="${logoWhiteUri}" href="${logoWhiteUri}"
    x="${(CARD_WIDTH - logoW) / 2}" y="${logoY}" width="${logoW}" height="${logoH}" preserveAspectRatio="xMidYMid meet"/>`
      : ""
  }

  <text x="${cx}" y="${CARD_HEIGHT - sc(28)}" text-anchor="middle"
    font-size="${sc(20)}" font-weight="600"
    fill="${QR_BRAND.muted}" letter-spacing="2">${escapeXml(payload.replace(/^https?:\/\//, ""))}</text>
</svg>`;
}

/**
 * Charge un buffer image redimensionné depuis public/.
 * @param {string} filePath
 * @param {number} width
 * @param {number} height
 * @param {{ transparentDark?: boolean }} [options]
 */
async function loadResizedPngBuffer(
  filePath,
  width,
  height,
  { transparentDark = false } = {}
) {
  const absolute = path.join(process.cwd(), filePath);
  let buffer = await fs.readFile(absolute);
  const isSvg = filePath.toLowerCase().endsWith(".svg");

  let pipeline = isSvg
    ? sharp(Buffer.from(sanitizeSvgContent(buffer.toString("utf8"))), {
        density: 300,
      })
    : sharp(buffer);

  if (!isSvg && transparentDark) {
    buffer = await makeDarkBackgroundTransparent(
      await pipeline.png().toBuffer()
    );
    pipeline = sharp(buffer);
  }

  return pipeline
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/**
 * PNG haute résolution — composition Sharp (fiable sur Vercel).
 * Pas de texte SVG système (évite les carrés □□□ en production).
 * @returns {Promise<Buffer>}
 */
export async function generateMenuQrPng() {
  const payload = getMenuQrPayload();
  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;

  const qrSize = sc(720);
  const qrX = Math.round((W - qrSize) / 2);
  const qrY = sc(260);
  const framePad = sc(32);
  const frameSize = qrSize + framePad * 2;
  const frameX = qrX - framePad;
  const frameY = qrY - framePad;
  const frameBottom = frameY + frameSize;

  const logoW = sc(900);
  const logoH = sc(300);
  const logoY = sc(1100);

  const [
    titlePng,
    subtitlePng,
    line1Png,
    line2Png,
    urlPng,
    qrPng,
    logoPng,
    fishPng,
    musselPng,
  ] = await Promise.all([
    renderTextPng("SCANNEZ", {
      fontSize: sc(84),
      color: QR_BRAND.white,
      width: W,
      height: sc(110),
      letterSpacing: sc(8),
    }),
    renderTextPng("POUR ACCÉDER AU MENU DIGITAL", {
      fontSize: sc(28),
      color: QR_BRAND.waveLight,
      width: W,
      height: sc(50),
      letterSpacing: sc(3),
    }),
    renderTextPng("DIRIGEZ VOTRE APPAREIL PHOTO", {
      fontSize: sc(22),
      color: QR_BRAND.white,
      width: W,
      height: sc(40),
      letterSpacing: 2,
    }),
    renderTextPng("VERS LE QR CODE", {
      fontSize: sc(22),
      color: QR_BRAND.white,
      width: W,
      height: sc(40),
      letterSpacing: 2,
    }),
    renderTextPng(payload.replace(/^https?:\/\//, ""), {
      fontSize: sc(20),
      color: QR_BRAND.muted,
      width: W,
      height: sc(36),
      letterSpacing: 2,
      fontWeight: 600,
    }),
    QRCode.toBuffer(payload, {
      ...QR_OPTIONS,
      type: "png",
      width: qrSize,
      margin: 2,
    }),
    loadResizedPngBuffer(LOGO_WHITE, logoW, logoH).catch(() => null),
    loadResizedPngBuffer(FISH_MINIMAL_SVG, sc(190), sc(114)).catch(() => null),
    loadResizedPngBuffer(MUSSEL_MINIMAL_IMAGE, sc(175), sc(175), {
      transparentDark: true,
    }).catch(() => null),
  ]);

  const viewfinderSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${viewfinderMarkup(frameX - sc(16), frameY - sc(16), frameSize + sc(32), QR_BRAND.white, sc(56), sc(5))}
</svg>`;
  const viewfinderPng = await sharp(Buffer.from(viewfinderSvg))
    .png()
    .toBuffer();

  /** @type {import("sharp").OverlayOptions[]} */
  const layers = [
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
    { input: titlePng, left: 0, top: sc(40) },
    { input: subtitlePng, left: 0, top: sc(145) },
    { input: line1Png, left: 0, top: frameBottom + sc(18) },
    { input: line2Png, left: 0, top: frameBottom + sc(48) },
  ];

  if (fishPng) {
    layers.push({ input: fishPng, left: sc(30), top: sc(1120) });
  }
  if (musselPng) {
    layers.push({
      input: musselPng,
      left: W - sc(30) - sc(175),
      top: sc(1115),
    });
  }
  if (logoPng) {
    layers.push({
      input: logoPng,
      left: Math.round((W - logoW) / 2),
      top: logoY,
    });
  }

  layers.push({ input: urlPng, left: 0, top: H - sc(50) });

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
 * Variante compacte carrée (QR + logo centre).
 * @returns {Promise<Buffer>}
 */
export async function generateMenuQrPngCompact() {
  const logoIconUri = await getLogoDataUri(LOGO_ICON, 120, { transparentBlack: true });
  const size = 1000;
  const badge = 120;

  const qrSvg = await QRCode.toString(getMenuQrPayload(), {
    ...QR_OPTIONS,
    type: "svg",
    width: size,
    margin: 3,
  });

  const { viewBox, inner: qrInner } = parseQrSvg(qrSvg);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${QR_BRAND.white}"/>
  <svg x="0" y="0" width="${size}" height="${size}" viewBox="${viewBox}">${qrInner}</svg>
  <circle cx="${size / 2}" cy="${size / 2}" r="${badge / 2 + 10}"
    fill="${QR_BRAND.white}" stroke="${QR_BRAND.navy}" stroke-width="5"/>
  <image xlink:href="${logoIconUri}" href="${logoIconUri}"
    x="${(size - badge) / 2}" y="${(size - badge) / 2}"
    width="${badge}" height="${badge}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

  return sharp(Buffer.from(svg, "utf8"), { density: 144 }).png().toBuffer();
}
