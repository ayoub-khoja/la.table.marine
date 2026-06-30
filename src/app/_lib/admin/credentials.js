import bcrypt from "bcryptjs";
import { getAdminAuthConfig } from "./config";

/**
 * Vérifie l'e-mail et le mot de passe admin (comparaison bcrypt constante).
 */
export async function verifyAdminCredentials(email, password) {
  const config = getAdminAuthConfig();
  if (!config) {
    return { ok: false, error: "NOT_CONFIGURED" };
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const expectedEmail = config.email.trim().toLowerCase();
  const emailMatch = normalizedEmail === expectedEmail;

  const passwordMatch = await bcrypt.compare(password, config.passwordHash);

  if (!emailMatch || !passwordMatch) {
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }

  return { ok: true, email: config.email };
}
