import { LOGIN_RATE_LIMIT } from "./constants";

const attempts = new Map();

function getClientKey(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Limite les tentatives de connexion par IP (mémoire — adapté au déploiement mono-instance).
 */
export function checkLoginRateLimit(request) {
  const key = getClientKey(request);
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.windowStart > LOGIN_RATE_LIMIT.windowMs) {
    attempts.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }

  if (entry.count >= LOGIN_RATE_LIMIT.maxAttempts) {
    const retryAfterMs = LOGIN_RATE_LIMIT.windowMs - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count += 1;
  return { allowed: true };
}

export function resetLoginRateLimit(request) {
  const key = getClientKey(request);
  attempts.delete(key);
}
