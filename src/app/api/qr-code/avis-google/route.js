import { NextResponse } from "next/server";

import { NO_STORE_CACHE_CONTROL } from "@library/google-review/constants";
import {
  GOOGLE_REVIEW_QR_PNG_FILENAME,
  GOOGLE_REVIEW_QR_SVG_FILENAME,
  generateGoogleReviewQrPng,
  generateGoogleReviewQrPngCompact,
  generateGoogleReviewQrSvg,
  generateGoogleReviewQrSvgPlain,
  getGoogleReviewQrPayload,
} from "@library/google-review/qr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * QR code permanent pour les avis Google (public, sans admin).
 * Encode uniquement {SITE_URL}/avis-google — jamais le lien Google direct.
 *
 * Query :
 * - format=png|svg
 * - variant=branded|compact  (png ; branded par défaut)
 * - download=0 pour prévisualiser inline
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "png").toLowerCase().trim();
    const variant = (searchParams.get("variant") || "branded")
      .toLowerCase()
      .trim();
    const asAttachment = searchParams.get("download") !== "0";
    const disposition = asAttachment ? "attachment" : "inline";

    if (format === "svg") {
      const svg =
        variant === "compact"
          ? await generateGoogleReviewQrSvgPlain()
          : await generateGoogleReviewQrSvg();
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Content-Disposition": `${disposition}; filename="${GOOGLE_REVIEW_QR_SVG_FILENAME}"`,
          "Cache-Control": NO_STORE_CACHE_CONTROL,
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
    let filename = GOOGLE_REVIEW_QR_PNG_FILENAME;

    if (variant === "compact") {
      png = await generateGoogleReviewQrPngCompact();
      filename = "qr-avis-google-la-table-marine-compact.png";
    } else {
      try {
        png = await generateGoogleReviewQrPng();
      } catch (brandedError) {
        console.error(
          "[api/qr-code/avis-google] branded failed, fallback compact:",
          brandedError
        );
        png = await generateGoogleReviewQrPngCompact();
        filename = "qr-avis-google-la-table-marine-compact.png";
      }
    }

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": NO_STORE_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("[api/qr-code/avis-google]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de générer le QR code." },
      { status: 500 }
    );
  }
}

export { getGoogleReviewQrPayload };
