/**
 * Résout le hash bcrypt depuis .env (format base64 recommandé pour Next.js).
 */
function resolvePasswordHash() {
  const b64 = process.env.ADMIN_PASSWORD_HASH_B64?.trim();
  if (b64) {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf8").trim();
      if (/^\$2[aby]\$\d{2}\$.+/.test(decoded)) {
        return decoded;
      }
    } catch {
      /* ignore */
    }
  }

  let raw = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!raw) return null;

  if (
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('"') && raw.endsWith('"'))
  ) {
    raw = raw.slice(1, -1);
  }

  raw = raw.replace(/\\\$/g, "$");

  return raw;
}

/**
 * Vérifie que les variables d'environnement d'authentification sont définies.
 */
export function getAdminAuthConfig() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const passwordHash = resolvePasswordHash();
  const jwtSecret = process.env.ADMIN_JWT_SECRET?.trim();

  if (!email || !passwordHash || !jwtSecret) {
    return null;
  }

  if (!/^\$2[aby]\$\d{2}\$.+/.test(passwordHash)) {
    console.error(
      "[admin] Hash mot de passe invalide. Utilisez ADMIN_PASSWORD_HASH_B64 (voir: node scripts/to-b64-hash.js \"VotreMotDePasse\")"
    );
    return null;
  }

  if (jwtSecret.length < 32) {
    console.error(
      "[admin] ADMIN_JWT_SECRET doit contenir au moins 32 caractères."
    );
    return null;
  }

  return { email, passwordHash, jwtSecret };
}

export function isAdminAuthConfigured() {
  return getAdminAuthConfig() !== null;
}
