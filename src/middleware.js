import { NextResponse } from "next/server";
import {
  ADMIN_LOGIN_PATH,
  ADMIN_DEFAULT_REDIRECT,
  ADMIN_PROTECTED_PATHS,
} from "@library/admin/constants";
import { getSessionFromRequest } from "@library/admin/session";

function isProtectedAdminPath(pathname) {
  return ADMIN_PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request) {
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
  matcher: ["/admin", "/admin/:path*"],
};
