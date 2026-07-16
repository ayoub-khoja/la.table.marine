import { NextResponse } from "next/server";

import { requireAdminSession } from "@library/admin/require-session";
import {
  MENU_QR_PNG_FILENAME,
  MENU_QR_SVG_FILENAME,
  generateMenuQrPng,
  generateMenuQrPngCompact,
  generateMenuQrSvg,
  getMenuQrPayload,
} from "@library/menu/qr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Génère le QR permanent brandé (PNG ou SVG).
 * Contenu toujours identique : URL /menu du domaine.
 *
 * Query :
 * - format=png|svg|json
 * - variant=branded|compact  (png uniquement ; branded par défaut)
 * - download=0 pour prévisualiser inline
 */
export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const format = (request.nextUrl.searchParams.get("format") || "png")
      .toLowerCase()
      .trim();
    const variant = (request.nextUrl.searchParams.get("variant") || "branded")
      .toLowerCase()
      .trim();
    const asAttachment = request.nextUrl.searchParams.get("download") !== "0";
    const disposition = asAttachment ? "attachment" : "inline";

    if (format === "json") {
      return NextResponse.json({
        success: true,
        url: getMenuQrPayload(),
        publicPath: "/menu",
        branded: true,
      });
    }

    if (format === "svg") {
      const svg = await generateMenuQrSvg();
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Content-Disposition": `${disposition}; filename="${MENU_QR_SVG_FILENAME}"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    if (format !== "png") {
      return NextResponse.json(
        { success: false, error: "Format non supporté. Utilisez png ou svg." },
        { status: 400 }
      );
    }

    let png;
    let filename = MENU_QR_PNG_FILENAME;

    if (variant === "compact") {
      png = await generateMenuQrPngCompact();
      filename = "qr-menu-la-table-marine-compact.png";
    } else {
      try {
        png = await generateMenuQrPng();
      } catch (brandedError) {
        // Fallback production si Sharp échoue sur le carton brandé (filtres SVG / mémoire).
        console.error("[api/admin/menu/qr] branded failed, fallback compact:", brandedError);
        png = await generateMenuQrPngCompact();
        filename = "qr-menu-la-table-marine-compact.png";
      }
    }

    // Uint8Array : réponse image fiable sur Vercel (Buffer Node parfois mal sérialisé).
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[api/admin/menu/qr]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de générer le QR code." },
      { status: 500 }
    );
  }
}
