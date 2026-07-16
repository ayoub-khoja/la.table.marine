import { NextResponse } from "next/server";

import { NO_STORE_CACHE_CONTROL } from "@library/google-review/constants";
import { getGoogleReviewRedirectTarget } from "@library/google-review/config";
import { renderGoogleReviewErrorHtml } from "@library/google-review/error-html";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REDIRECT_STATUS = 302;

/**
 * Redirection publique permanente vers la page Google d'avis.
 * L'URL /avis-google reste stable ; seule GOOGLE_REVIEW_URL change côté serveur.
 */
export async function GET() {
  const target = getGoogleReviewRedirectTarget();

  if (!target.ok) {
    console.error("[avis-google] Redirection indisponible:", target.reason);
    return new NextResponse(renderGoogleReviewErrorHtml(), {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": NO_STORE_CACHE_CONTROL,
      },
    });
  }

  return NextResponse.redirect(target.url, {
    status: REDIRECT_STATUS,
    headers: {
      "Cache-Control": NO_STORE_CACHE_CONTROL,
    },
  });
}
