const HINT_LINES = new Set(
  [
    "indiquez un message (allergies, préférence, demande spéciale…).",
    "indiquez un message (allergies, preference, demande speciale...).",
    "indiquez un message (allergies, préférence, demande spéciale...).",
    "allergies, préférences, demande spéciale…",
    "allergies, preferences, demande speciale...",
    "allergies, préférences ou demande spéciale.",
    "ex. table près de la fenêtre, allergie aux fruits de mer…",
    "détails",
    "message optionnel",
    "écrivez-nous un message",
  ].map((line) => line.toLowerCase())
);

/**
 * Retire uniquement les lignes d'aide / placeholder du formulaire.
 * Le vrai message client est toujours conservé.
 */
export function normalizeCustomerMessage(message) {
  const trimmed = (message || "").trim();
  if (!trimmed) return "";

  const lines = trimmed
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !HINT_LINES.has(line.toLowerCase()));

  return lines.join("\n").trim();
}
