import { promises as fs } from "fs";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";

import { getPermanentMenuUrl } from "@library/menu/public-url";

export const MENU_QR_PNG_FILENAME = "qr-menu-la-table-marine.png";
export const MENU_QR_SVG_FILENAME = "qr-menu-la-table-marine.svg";

/** Couleurs marque La Table Marine */
export const QR_BRAND = {
  navy: "#0B4F7A",
  navyDark: "#083A5A",
  wave: "#1E7AAD",
  sand: "#F7F4EF",
  white: "#FFFFFF",
  ink: "#12263A",
  muted: "#5B7185",
};

const LOGO_RELATIVE = path.join("public", "img", "logo-sans-texte.png");

const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: {
    dark: QR_BRAND.navy,
    light: QR_BRAND.white,
  },
};

/** Cache du logo traité (fond noir → transparent). */
let logoDataUriPromise = null;

/**
 * Contenu exact du QR — URL permanente uniquement.
 */
export function getMenuQrPayload() {
  return getPermanentMenuUrl();
}

/**
 * Extrait le viewBox et le contenu interne d'un SVG généré par qrcode.
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
 * Rend les pixels quasi noirs du logo transparents pour l'intégrer au centre du QR.
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

async function getBrandLogoDataUri() {
  if (!logoDataUriPromise) {
    logoDataUriPromise = (async () => {
      const logoPath = path.join(process.cwd(), LOGO_RELATIVE);
      const raw = await fs.readFile(logoPath);
      const transparent = await makeBlackBackgroundTransparent(raw);
      const resized = await sharp(transparent)
        .resize(140, 140, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      return `data:image/png;base64,${resized.toString("base64")}`;
    })().catch((error) => {
      logoDataUriPromise = null;
      throw error;
    });
  }

  return logoDataUriPromise;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Construit le carton QR professionnel (marque + logo + icônes).
 * @returns {Promise<string>}
 */
export async function generateMenuQrSvg() {
  const payload = getMenuQrPayload();
  const logoDataUri = await getBrandLogoDataUri();

  const qrSvg = await QRCode.toString(payload, {
    ...QR_OPTIONS,
    type: "svg",
    width: 820,
    margin: 2,
  });

  const { viewBox, inner: qrInner } = parseQrSvg(qrSvg);

  const cardWidth = 1200;
  const cardHeight = 1500;
  const qrX = 190;
  const qrY = 250;
  const qrSize = 820;
  const center = qrX + qrSize / 2;
  const badgeSize = 120;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" role="img"
  aria-label="QR code menu La Table Marine">
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${QR_BRAND.sand}"/>
      <stop offset="100%" stop-color="${QR_BRAND.white}"/>
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${QR_BRAND.navyDark}" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Fond carton -->
  <rect width="${cardWidth}" height="${cardHeight}" rx="32" fill="url(#cardBg)"/>
  <rect x="32" y="32" width="${cardWidth - 64}" height="${cardHeight - 64}" rx="24"
    fill="none" stroke="${QR_BRAND.navy}" stroke-width="2" opacity="0.15"/>

  <!-- En-tête marque -->
  <text x="600" y="110" text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="700"
    fill="${QR_BRAND.navyDark}" letter-spacing="5">LA TABLE MARINE</text>
  <text x="600" y="152" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="20"
    fill="${QR_BRAND.muted}" letter-spacing="4">RESTAURANT DE FRUITS DE MER</text>
  <path fill="none" stroke="${QR_BRAND.wave}" stroke-width="2" stroke-linecap="round" opacity="0.6"
    d="M420 188c35-10 60-10 95 0s60 10 95 0 60-10 95 0"/>

  <!-- Cadre blanc QR -->
  <rect x="${qrX - 20}" y="${qrY - 20}" width="${qrSize + 40}" height="${qrSize + 40}"
    rx="24" fill="${QR_BRAND.white}" filter="url(#softShadow)"
    stroke="${QR_BRAND.navy}" stroke-width="1.5" stroke-opacity="0.1"/>

  <!-- QR code (viewBox original conservé pour un rendu plein écran) -->
  <svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" viewBox="${viewBox}">
    ${qrInner}
  </svg>

  <!-- Logo ancre au centre (petit badge, ne remplace pas le QR) -->
  <circle cx="${center}" cy="${qrY + qrSize / 2}" r="${badgeSize / 2 + 8}"
    fill="${QR_BRAND.white}" stroke="${QR_BRAND.navy}" stroke-width="4"/>
  <image xlink:href="${logoDataUri}" href="${logoDataUri}"
    x="${center - badgeSize / 2}" y="${qrY + qrSize / 2 - badgeSize / 2}"
    width="${badgeSize}" height="${badgeSize}" preserveAspectRatio="xMidYMid meet"/>

  <!-- Pied de page -->
  <text x="600" y="1150" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700"
    fill="${QR_BRAND.navyDark}">Scannez pour découvrir la carte</text>
  <text x="600" y="1190" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="18"
    fill="${QR_BRAND.muted}">${escapeXml(payload.replace(/^https?:\/\//, ""))}</text>

  <!-- Motifs marins discrets -->
  <g opacity="0.55">
    <path fill="${QR_BRAND.wave}" d="M180 1280c20-8 36-8 56 0s36 8 56 0 36-8 56 0 36 8 56 0 36-8 56 0"/>
    <g transform="translate(220 1320)">
      <path fill="${QR_BRAND.wave}" d="M0 14c10-10 24-14 38-12 8 2 14 6 18 12-4 6-10 10-18 12-14 2-28-2-38-12 4-2 7-3 8-4-1-1-4-2-8-4z"/>
      <circle fill="${QR_BRAND.white}" cx="34" cy="14" r="1.8"/>
    </g>
    <g transform="translate(920 1318)">
      <path fill="${QR_BRAND.wave}" d="M22 28c0-10 8-20 18-24 2 6 2 14-2 22-4 10-12 16-22 20 3-5 6-11 6-18z"/>
    </g>
  </g>

  <text x="600" y="1420" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="16"
    fill="${QR_BRAND.muted}" letter-spacing="3">PLAISIR · YVELINES</text>
</svg>`;
}

/**
 * PNG haute résolution du carton QR brandé.
 * @returns {Promise<Buffer>}
 */
export async function generateMenuQrPng() {
  const svg = await generateMenuQrSvg();
  return sharp(Buffer.from(svg))
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();
}

/**
 * Variante compacte (QR seul + logo centre) — pour usages techniques.
 * @returns {Promise<Buffer>}
 */
export async function generateMenuQrPngCompact() {
  const payload = getMenuQrPayload();
  const logoDataUri = await getBrandLogoDataUri();
  const size = 1000;
  const badge = 140;

  const qrSvg = await QRCode.toString(payload, {
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
  <image xlink:href="${logoDataUri}" href="${logoDataUri}"
    x="${(size - badge) / 2}" y="${(size - badge) / 2}"
    width="${badge}" height="${badge}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
