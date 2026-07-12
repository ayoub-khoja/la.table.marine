export const GA4_CUSTOM_EVENTS = [
  "reservation_started",
  "reservation_completed",
  "menu_viewed",
  "phone_clicked",
  "email_clicked",
  "directions_clicked",
  "contact_form_submitted",
  "newsletter_subscribed",
];

export const GA4_EVENT_LABELS = {
  reservation_started: "Réservation commencée",
  reservation_completed: "Réservation terminée",
  menu_viewed: "Menu consulté",
  phone_clicked: "Clic téléphone",
  email_clicked: "Clic e-mail",
  directions_clicked: "Clic itinéraire",
  contact_form_submitted: "Formulaire contact",
  newsletter_subscribed: "Newsletter",
};

export const GA4_KPI_METRICS = [
  "activeUsers",
  "newUsers",
  "sessions",
  "screenPageViews",
  "engagementRate",
  "averageSessionDuration",
];

export const GA4_CACHE_TTL = {
  standard: 5 * 60 * 1000,
  realtime: 60 * 1000,
};

export const GA4_REQUEST_TIMEOUT_MS = 15000;

export const GA4_MAX_PERIOD_DAYS = 730;

const PRIVATE_KEY_PLACEHOLDERS = new Set([
  "",
  "VOTRE_CLE_ICI",
  "YOUR_PRIVATE_KEY_HERE",
]);

/** @type {{ email: string, privateKey: string } | null} */
let cachedServiceAccountFile = undefined;

/**
 * @returns {string | null}
 */
function resolveServiceAccountJsonPath() {
  const envPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH?.trim();
  if (envPath) {
    return envPath;
  }

  try {
    const fs = require("fs");
    const path = require("path");
    const defaultPath = path.join(process.cwd(), "service-account.json");
    if (fs.existsSync(defaultPath)) {
      return defaultPath;
    }
  } catch {
    // ignore (ex. environnement sans fs)
  }

  return null;
}

/**
 * @returns {{ email: string, privateKey: string } | null}
 */
export function loadServiceAccountFromFile() {
  if (cachedServiceAccountFile !== undefined) {
    return cachedServiceAccountFile;
  }

  const jsonPath = resolveServiceAccountJsonPath();
  if (!jsonPath) {
    cachedServiceAccountFile = null;
    return null;
  }

  try {
    const fs = require("fs");
    const raw = fs.readFileSync(jsonPath, "utf8");
    const parsed = JSON.parse(raw);
    const email = parsed.client_email?.trim() || "";
    const privateKey = parsed.private_key?.trim() || "";

    if (!email || !privateKey) {
      cachedServiceAccountFile = null;
      return null;
    }

    cachedServiceAccountFile = { email, privateKey };
    return cachedServiceAccountFile;
  } catch {
    cachedServiceAccountFile = null;
    return null;
  }
}

/**
 * @returns {string | null}
 */
export function getGa4ServiceAccountEmail() {
  const fromEnv = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  if (fromEnv) return fromEnv;
  return loadServiceAccountFromFile()?.email || null;
}

/**
 * @param {string | undefined} raw
 * @returns {boolean}
 */
function isUsablePrivateKeyEnv(raw) {
  if (!raw) return false;
  const normalized = raw.trim().replace(/\\n/g, "\n");
  if (PRIVATE_KEY_PLACEHOLDERS.has(normalized)) return false;
  if (normalized.includes("VOTRE_CLE_ICI")) return false;
  return normalized.includes("BEGIN PRIVATE KEY");
}

export const GA4_ALLOWED_DIMENSIONS = new Set([
  "date",
  "dateHour",
  "hour",
  "sessionSource",
  "sessionMedium",
  "sessionCampaignName",
  "pageTitle",
  "pagePath",
  "deviceCategory",
  "city",
  "country",
  "eventName",
  "unifiedScreenName",
]);

export const GA4_ALLOWED_METRICS = new Set([
  "activeUsers",
  "newUsers",
  "sessions",
  "screenPageViews",
  "engagementRate",
  "averageSessionDuration",
  "userEngagementDuration",
  "eventCount",
  "conversions",
]);

/**
 * @returns {{ isConfigured: boolean, propertyId: string | null, message: string }}
 */
export function getGa4Config() {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim() || "";
  const email = getGa4ServiceAccountEmail() || "";
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim() || "";
  const privateKeyFromFile = loadServiceAccountFromFile()?.privateKey || "";
  const hasPrivateKey =
    isUsablePrivateKeyEnv(privateKeyRaw) || Boolean(privateKeyFromFile);

  if (!propertyId || !email || !hasPrivateKey) {
    const missing = [];
    if (!propertyId) missing.push("GA4_PROPERTY_ID");
    if (!email) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!hasPrivateKey) {
      missing.push(
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ou service-account.json"
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[GA4] Configuration incomplète — variables manquantes : ${missing.join(", ")}`
      );
    }

    return {
      isConfigured: false,
      propertyId: null,
      message:
        "Google Analytics 4 n'est pas configuré côté serveur. Ajoutez les variables d'environnement requises (voir docs/analytics-dashboard.md).",
    };
  }

  return {
    isConfigured: true,
    propertyId: normalizePropertyId(propertyId),
    message: "",
  };
}

/**
 * @returns {string | null}
 */
export function getGa4PrivateKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  if (isUsablePrivateKeyEnv(raw)) {
    let key = raw.replace(/\\n/g, "\n");

    // Clé collée entre guillemets avec vrais retours à la ligne (Vercel / .env)
    if (key.startsWith('"') && key.endsWith('"')) {
      key = key.slice(1, -1).replace(/\\n/g, "\n");
    }

    return key;
  }

  return loadServiceAccountFromFile()?.privateKey || null;
}

/**
 * @param {string} propertyId
 * @returns {string}
 */
export function normalizePropertyId(propertyId) {
  const trimmed = propertyId.trim();
  if (trimmed.startsWith("properties/")) {
    return trimmed.replace("properties/", "");
  }
  return trimmed;
}

/**
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateGa4Credentials() {
  const email = getGa4ServiceAccountEmail();
  const privateKey = getGa4PrivateKey();
  const propertyId = normalizePropertyId(process.env.GA4_PROPERTY_ID?.trim() || "");

  if (!propertyId) {
    return { valid: false, error: "GA4_PROPERTY_ID manquant." };
  }

  if (!/^\d+$/.test(propertyId)) {
    return {
      valid: false,
      error:
        "GA4_PROPERTY_ID doit être un numéro (ex. 123456789), pas l'ID de mesure G-CZ8VZEBR4G.",
    };
  }

  if (!email?.includes("@") || !email.includes(".iam.gserviceaccount.com")) {
    return {
      valid: false,
      error: "GOOGLE_SERVICE_ACCOUNT_EMAIL invalide (doit finir par .iam.gserviceaccount.com).",
    };
  }

  if (!privateKey?.includes("BEGIN PRIVATE KEY")) {
    return {
      valid: false,
      error:
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY invalide (doit contenir BEGIN PRIVATE KEY).",
    };
  }

  return { valid: true };
}

/**
 * Réinitialise le cache fichier (tests uniquement).
 */
export function resetGa4ConfigForTests() {
  cachedServiceAccountFile = undefined;
}
