/**
 * Teste la connexion SMTP depuis .env.local
 * Usage: node scripts/verify-smtp.js
 */
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Fichier .env.local introuvable.");
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  value = value.replace(/^["']|["']$/g, "");
  env[key] = value;
}

const host = env.SMTP_HOST;
const port = Number(env.SMTP_PORT || "465");
const user = env.SMTP_USER;
const pass = env.SMTP_PASS;

if (!host || !user || !pass) {
  console.error("SMTP_HOST, SMTP_USER et SMTP_PASS sont requis dans .env.local");
  process.exit(1);
}

console.log("Test SMTP :", host, "port", port, "user", user);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  requireTLS: port !== 465,
  auth: { user, pass },
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  tls: { minVersion: "TLSv1.2", servername: host },
});

transporter
  .verify()
  .then(() => {
    console.log("Connexion SMTP réussie.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Échec SMTP :", error.message);
    if (error.code) console.error("Code :", error.code);
    console.error(`
Si ça échoue sur Vercel mais pas en local :
1. Redeploy après ajout des variables
2. Essayez SMTP_PORT=587
3. Vérifiez le mot de passe Hostinger (caractère & à la fin)
4. Ouvrez /api/admin/smtp/status une fois connecté à l'admin en production
`);
    process.exit(1);
  });
