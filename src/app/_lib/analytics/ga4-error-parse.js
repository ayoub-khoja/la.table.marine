/**
 * @param {unknown} error
 * @returns {string | null}
 */
export function parseGoogleApiErrorMessage(error) {
  if (!error || typeof error !== "object") return null;

  const message = "message" in error ? String(error.message) : "";
  const code = "code" in error ? Number(error.code) : null;
  const details = "details" in error ? String(error.details) : "";
  const combined = `${message} ${details}`.toLowerCase();

  if (
    code === 7 ||
    combined.includes("permission_denied") ||
    combined.includes("does not have sufficient permissions")
  ) {
    return "Accès refusé : ajoutez l'email du compte de service dans GA4 → Administration → Gestion des accès à la propriété (rôle Lecteur ou Analyste).";
  }

  if (
    code === 16 ||
    combined.includes("unauthenticated") ||
    combined.includes("invalid_grant") ||
    combined.includes("invalid jwt")
  ) {
    return "Authentification Google échouée : vérifiez GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (retours à la ligne \\n sur Vercel).";
  }

  if (code === 5 || combined.includes("not_found")) {
    return "Propriété GA4 introuvable : vérifiez que GA4_PROPERTY_ID est l'identifiant numérique (pas G-CZ8VZEBR4G).";
  }

  if (code === 3 || combined.includes("invalid_argument")) {
    if (combined.includes("property")) {
      return "GA4_PROPERTY_ID invalide : utilisez uniquement le numéro de propriété, sans le préfixe properties/.";
    }
    return "Requête Google Analytics invalide. Vérifiez la configuration GA4.";
  }

  if (
    combined.includes("analyticsdata.googleapis.com") &&
    (combined.includes("not enabled") || combined.includes("has not been used"))
  ) {
    return "Activez la Google Analytics Data API dans Google Cloud Console pour votre projet.";
  }

  if (combined.includes("private key") || combined.includes("no key or keyfile")) {
    return "Clé privée du compte de service invalide ou mal formatée.";
  }

  if (message && message.length < 220 && !message.includes("Error:")) {
    return message;
  }

  return null;
}
