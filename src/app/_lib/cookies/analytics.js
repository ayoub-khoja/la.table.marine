import { canUseAnalytics, loadConsent } from "./consent-storage";

/**
 * @returns {string | null}
 */
export function getGaMeasurementId() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return id || null;
}

/**
 * @returns {boolean}
 */
export function isGaConfigured() {
  return Boolean(getGaMeasurementId());
}

/**
 * @returns {boolean}
 */
export function isAnalyticsAllowed() {
  return canUseAnalytics(loadConsent());
}

/**
 * @param {string} measurementId
 */
export function loadGoogleAnalyticsScript(measurementId) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (!measurementId) return;

  const existing = document.querySelector(
    `script[data-ltm-ga-script="${measurementId}"]`
  );
  if (existing) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.setAttribute("data-ltm-ga-script", measurementId);
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    send_page_view: true,
  });
}

/**
 */
export function unloadGoogleAnalytics() {
  if (typeof document === "undefined") return;

  const scripts = document.querySelectorAll("script[data-ltm-ga-script]");
  scripts.forEach((script) => script.remove());

  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
}

/**
 * @param {{ pathname: string, search?: string, title?: string }} input
 */
export function trackPageView({ pathname, search = "", title }) {
  if (!isAnalyticsAllowed()) return;

  const measurementId = getGaMeasurementId();
  if (!measurementId) return;

  const gtag = typeof window !== "undefined" ? window.gtag : undefined;
  if (typeof gtag !== "function") return;

  const pagePath = `${pathname}${search || ""}`;
  const pageLocation =
    typeof window !== "undefined" ? `${window.location.origin}${pagePath}` : pagePath;

  gtag("event", "page_view", {
    page_path: pagePath,
    page_title: title || (typeof document !== "undefined" ? document.title : undefined),
    page_location: pageLocation,
    send_to: measurementId,
  });
}

/**
 * @param {import('./consent-types').TrackEventInput} input
 */
export function trackEvent({ name, params = {} }) {
  if (!isAnalyticsAllowed()) return;

  const measurementId = getGaMeasurementId();
  if (!measurementId) return;

  const gtag = typeof window !== "undefined" ? window.gtag : undefined;
  if (typeof gtag !== "function") return;

  const safeParams = { ...params };
  const forbiddenKeys = [
    "email",
    "phone",
    "name",
    "first_name",
    "last_name",
    "address",
    "message",
    "allergies",
    "reservation",
  ];

  for (const key of forbiddenKeys) {
    if (key in safeParams) {
      delete safeParams[key];
    }
  }

  gtag("event", name, {
    ...safeParams,
    send_to: measurementId,
  });
}

if (
  process.env.NODE_ENV === "development" &&
  typeof window !== "undefined" &&
  !getGaMeasurementId()
) {
  console.info(
    "[La Table Marine] NEXT_PUBLIC_GA_MEASUREMENT_ID non défini — Google Analytics désactivé."
  );
}
