import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE_DEFAULT,
  SESSION_MAX_AGE_REMEMBER,
} from "./constants";
import { getAdminAuthConfig } from "./config";

function getSecretKey() {
  const config = getAdminAuthConfig();
  if (!config) return null;
  return new TextEncoder().encode(config.jwtSecret);
}

export function getSessionCookieOptions(remember = false) {
  const maxAge = remember
    ? SESSION_MAX_AGE_REMEMBER
    : SESSION_MAX_AGE_DEFAULT;

  return {
    name: ADMIN_SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export async function createSessionToken(email, remember = false) {
  const secret = getSecretKey();
  if (!secret) {
    throw new Error("AUTH_NOT_CONFIGURED");
  }

  const maxAge = remember
    ? SESSION_MAX_AGE_REMEMBER
    : SESSION_MAX_AGE_DEFAULT;

  return new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .setSubject(email)
    .sign(secret);
}

export async function verifySessionToken(token) {
  const secret = getSecretKey();
  if (!secret || !token) return null;

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (payload.role !== "admin" || typeof payload.email !== "string") {
      return null;
    }

    return {
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function getSessionFromRequest(request) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export function setSessionCookie(token, remember = false) {
  const cookieStore = cookies();
  const options = getSessionCookieOptions(remember);
  cookieStore.set(options.name, token, options);
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

/**
 * Valide une URL de redirection interne admin uniquement.
 */
export function sanitizeRedirectPath(path) {
  if (!path || typeof path !== "string") {
    return null;
  }

  if (!path.startsWith("/admin/") || path === "/admin") {
    return null;
  }

  if (path.includes("..") || path.includes("//")) {
    return null;
  }

  return path;
}
