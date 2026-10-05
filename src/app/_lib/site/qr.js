import QRCode from "qrcode";

import { getSiteUrl } from "@library/menu/public-url";

export const SITE_QR_PNG_FILENAME = "qr-site-la-table-marine.png";

const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
};

/** Contenu exact du QR — URL du site (domaine courant). */
export function getSiteQrPayload() {
  return getSiteUrl();
}

/** QR compact pour aperçu sidebar / téléchargement. */
export async function generateSiteQrPng() {
  return QRCode.toBuffer(getSiteQrPayload(), {
    ...QR_OPTIONS,
    type: "png",
    width: 512,
    margin: 2,
  });
}
