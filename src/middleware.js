import { NextResponse } from "next/server";
import {
  ADMIN_LOGIN_PATH,
  ADMIN_DEFAULT_REDIRECT,
  ADMIN_PROTECTED_PATHS,
} from "@library/admin/constants";
import { getSessionFromRequest } from "@library/admin/session";

const CANONICAL_HOST = "latablemarine.com";

function redirectToCanonicalHost(request) {
  const hostHeader = request.headers.get("host") || "";
  const hostname = hostHeader.split(":")[0].toLowerCase();

  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".vercel.app")
  ) {
    return null;
  }

  if (hostname !== CANONICAL_HOST && hostname !== `www.${CANONICAL_HOST}`) {
    return null;
  }

  const proto = request.headers.get("x-forwarded-proto") || "https";
  const needsHttps = proto === "http";
  const needsWwwStrip = hostname === `www.${CANONICAL_HOST}`;

  if (!needsHttps && !needsWwwStrip) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = CANONICAL_HOST;
  url.port = "";

  return NextResponse.redirect(url, 308);
}

function isProtectedAdminPath(pathname) {
  return ADMIN_PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request) {
  const canonicalRedirect = redirectToCanonicalHost(request);
  if (canonicalRedirect) {
    return canonicalRedirect;
  }

  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);
  const isLoginPage = pathname === ADMIN_LOGIN_PATH;

  if (isLoginPage && session) {
    return NextResponse.redirect(new URL(ADMIN_DEFAULT_REDIRECT, request.url));
  }

  if (isProtectedAdminPath(pathname) && !session) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|woff|woff2|ttf|eot|pdf)$).*)",
  ],
};
