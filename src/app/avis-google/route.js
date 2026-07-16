import { NextResponse } from "next/server";

import { NO_STORE_CACHE_CONTROL } from "@library/google-review/constants";
import { getGoogleReviewRedirectTarget } from "@library/google-review/config";
import { renderGoogleReviewErrorHtml } from "@library/google-review/error-html";
import { renderGoogleReviewRedirectHtml } from "@library/google-review/redirect-html";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Route permanente /avis-google.
 *
 * Si l'URL Google contient un fragment (#lrd=...,3), on utilise une
 * redirection HTML/JS : un 302 HTTP perd le # et n'ouvre que la fiche
 * Google, pas la fenêtre « écrire un avis ».
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

  const hasHashFragment = target.url.includes("#");

  if (hasHashFragment) {
    return new NextResponse(renderGoogleReviewRedirectHtml(target.url), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": NO_STORE_CACHE_CONTROL,
      },
    });
  }

  return NextResponse.redirect(target.url, {
    status: 302,
    headers: {
      "Cache-Control": NO_STORE_CACHE_CONTROL,
    },
  });
}
