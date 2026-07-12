/**
 * Vérifie la connexion Google Analytics Data API.
 * Usage : npm run ga4:verify
 */
const fs = require("fs");
const path = require("path");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  });
}

function getPrivateKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  if (raw && !raw.includes("VOTRE_CLE_ICI") && raw.includes("BEGIN PRIVATE KEY")) {
    let key = raw.replace(/\\n/g, "\n");
    if (key.startsWith('"') && key.endsWith('"')) {
      key = key.slice(1, -1).replace(/\\n/g, "\n");
    }
    return key;
  }

  const jsonPath =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH?.trim() ||
    path.join(process.cwd(), "service-account.json");

  if (!fs.existsSync(jsonPath)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    return parsed.private_key?.trim() || null;
  } catch {
    return null;
  }
}

function getServiceAccountEmail() {
  const fromEnv = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  if (fromEnv) return fromEnv;

  const jsonPath =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH?.trim() ||
    path.join(process.cwd(), "service-account.json");

  if (!fs.existsSync(jsonPath)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    return parsed.client_email?.trim() || null;
  } catch {
    return null;
  }
}

function normalizePropertyId(id) {
  const trimmed = (id || "").trim();
  return trimmed.startsWith("properties/") ? trimmed.replace("properties/", "") : trimmed;
}

async function main() {
  loadEnvLocal();

  const propertyId = normalizePropertyId(process.env.GA4_PROPERTY_ID);
  const email = getServiceAccountEmail();
  const privateKey = getPrivateKey();

  const missing = [];
  if (!propertyId) missing.push("GA4_PROPERTY_ID");
  if (!email) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!privateKey) {
    missing.push("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ou service-account.json");
  }

  if (missing.length) {
    console.error("❌ Variables manquantes :", missing.join(", "));
    console.error("Voir docs/analytics-dashboard.md");
    process.exit(1);
  }

  if (!/^\d+$/.test(propertyId)) {
    console.error(
      "❌ GA4_PROPERTY_ID doit être un numéro (pas G-CZ8VZEBR4G qui est l'ID de mesure)."
    );
    process.exit(1);
  }

  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    console.error("❌ GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY invalide (BEGIN PRIVATE KEY manquant).");
    process.exit(1);
  }

  console.log("Property ID :", propertyId);
  console.log("Service account :", email);

  try {
    const client = new BetaAnalyticsDataClient({
      credentials: { client_email: email, private_key: privateKey },
    });

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }],
    });

    const users = response?.rows?.[0]?.metricValues?.[0]?.value || "0";
    console.log("\n✅ Connexion GA4 OK — utilisateurs actifs (7 j) :", users);
  } catch (error) {
    console.error("\n❌ Échec connexion GA4 :");
    console.error(error.message || error);
    process.exit(1);
  }
}

main();
