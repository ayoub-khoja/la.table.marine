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
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() || "";
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim() || "";

  if (!propertyId || !email || !privateKeyRaw) {
    const missing = [];
    if (!propertyId) missing.push("GA4_PROPERTY_ID");
    if (!email) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!privateKeyRaw) missing.push("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");

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
    propertyId,
    message: "",
  };
}

/**
 * @returns {string | null}
 */
export function getGa4PrivateKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  if (!raw) return null;
  return raw.replace(/\\n/g, "\n");
}
