import { NextResponse } from "next/server";
import { isAdminAuthConfigured } from "@library/admin/config";
import { verifyAdminCredentials } from "@library/admin/credentials";
import {
  checkLoginRateLimit,
  resetLoginRateLimit,
} from "@library/admin/rate-limit";
import { ADMIN_DEFAULT_REDIRECT } from "@library/admin/constants";
import {
  createSessionToken,
  getSessionCookieOptions,
  sanitizeRedirectPath,
} from "@library/admin/session";

export async function POST(request) {
  try {
    if (!isAdminAuthConfigured()) {
      return NextResponse.json(
        { error: "Authentification non configurée sur le serveur." },
        { status: 503 }
      );
    }

    const rateLimit = checkLoginRateLimit(request);
    if (!rateLimit.allowed) {
      const retryMinutes = Math.ceil((rateLimit.retryAfterMs || 0) / 60000);
      return NextResponse.json(
        {
          error: `Trop de tentatives. Réessayez dans ${retryMinutes} minute(s).`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = body?.email;
    const password = body?.password;
    const remember = Boolean(body?.remember);
    const redirectTo = sanitizeRedirectPath(body?.redirect) || ADMIN_DEFAULT_REDIRECT;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail et mot de passe requis." },
        { status: 400 }
      );
    }

    const result = await verifyAdminCredentials(email, password);

    if (!result.ok) {
      return NextResponse.json(
        { error: "Identifiants incorrects." },
        { status: 401 }
      );
    }

    resetLoginRateLimit(request);

    const token = await createSessionToken(result.email, remember);
    const cookieOptions = getSessionCookieOptions(remember);

    const response = NextResponse.json({
      success: true,
      redirect: redirectTo,
    });

    response.cookies.set(cookieOptions.name, token, cookieOptions);

    return response;
  } catch (error) {
    console.error("[admin/login]", error);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Méthode non autorisée." }, { status: 405 });
}
