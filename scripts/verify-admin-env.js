/**
 * Vérifie que .env.local charge correctement le hash bcrypt.
 * Usage: node scripts/verify-admin-env.js
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Fichier .env.local introuvable.");
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf8");
const vars = {};

for (const line of content.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1);
  }
  vars[key] = value;
}

const email = vars.ADMIN_EMAIL;
let hash = null;

if (vars.ADMIN_PASSWORD_HASH_B64) {
  hash = Buffer.from(vars.ADMIN_PASSWORD_HASH_B64, "base64").toString("utf8");
} else if (vars.ADMIN_PASSWORD_HASH) {
  hash = vars.ADMIN_PASSWORD_HASH.replace(/\\\$/g, "$");
}

console.log("ADMIN_EMAIL:", email);
console.log("Hash commence par $2:", hash?.startsWith("$2"));
console.log("Longueur hash:", hash?.length);

if (!hash?.startsWith("$2")) {
  console.error("Hash invalide. Lancez: node scripts/to-b64-hash.js \"Test123*\"");
  process.exit(1);
}

bcrypt.compare("Test123*", hash).then((ok) => {
  console.log("Test123* correspond:", ok);
  process.exit(ok ? 0 : 1);
});
