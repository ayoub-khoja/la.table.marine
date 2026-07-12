/**
 * Affiche les valeurs à coller dans Vercel (sans exposer la clé dans le repo).
 * Usage : npm run ga4:vercel-env
 */
const fs = require("fs");
const path = require("path");

const jsonPath =
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH?.trim() ||
  path.join(process.cwd(), "service-account.json");

if (!fs.existsSync(jsonPath)) {
  console.error("❌ Fichier introuvable :", jsonPath);
  console.error("Placez votre JSON Google Cloud à la racine : service-account.json");
  process.exit(1);
}

const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const propertyId = process.env.GA4_PROPERTY_ID?.trim() || "545230137";
const email = parsed.client_email?.trim();
const privateKey = parsed.private_key?.trim();

if (!email || !privateKey) {
  console.error("❌ JSON invalide : client_email ou private_key manquant.");
  process.exit(1);
}

const privateKeyOneLine = privateKey.replace(/\n/g, "\\n");
const jsonOneLine = JSON.stringify(parsed);

console.log("\n=== Variables Vercel (Production + Preview) ===\n");
console.log("GA4_PROPERTY_ID");
console.log(propertyId);
console.log("\nGOOGLE_SERVICE_ACCOUNT_EMAIL");
console.log(email);
console.log("\nGOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
console.log(privateKeyOneLine);
console.log("\n--- OU (recommandé sur Vercel, évite les problèmes de \\n) ---\n");
console.log("GOOGLE_SERVICE_ACCOUNT_JSON");
console.log(jsonOneLine);
console.log("\n⚠️  Après ajout/modification : Redeploy obligatoire sur Vercel.");
console.log("⚠️  Ne commitez jamais service-account.json ni ces valeurs.\n");
