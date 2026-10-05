import { NextResponse } from "next/server";

import { requireAdminSession } from "@library/admin/require-session";
import {
  SITE_QR_PNG_FILENAME,
  generateSiteQrPng,
  getSiteQrPayload,
} from "@library/site/qr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * QR code dynamique du site — encode l'URL publique courante.
 *
 * Query :
 * - format=png|json
 * - download=0 pour prévisualiser inline
 */
export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const format = (request.nextUrl.searchParams.get("format") || "png")
      .toLowerCase()
      .trim();
    const asAttachment = request.nextUrl.searchParams.get("download") !== "0";
    const disposition = asAttachment ? "attachment" : "inline";

    if (format === "json") {
      return NextResponse.json({
        success: true,
        url: getSiteQrPayload(),
      });
    }

    if (format !== "png") {
      return NextResponse.json(
        { success: false, error: "Format non supporté. Utilisez png." },
        { status: 400 }
      );
    }

    const png = await generateSiteQrPng();

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `${disposition}; filename="${SITE_QR_PNG_FILENAME}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[api/admin/site/qr]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de générer le QR code." },
      { status: 500 }
    );
  }
}
