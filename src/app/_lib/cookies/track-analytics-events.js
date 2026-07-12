import { trackEvent } from "./analytics";
import { ANALYTICS_EVENT_NAMES } from "./consent-config";

/**
 * @param {Record<string, string | number | boolean | undefined>} [params]
 */
export function trackReservationStarted(params = {}) {
  trackEvent({
    name: ANALYTICS_EVENT_NAMES.RESERVATION_STARTED,
    params: { source: "reservation_form", ...params },
  });
}

/**
 * @param {Record<string, string | number | boolean | undefined>} [params]
 */
export function trackReservationCompleted(params = {}) {
  trackEvent({
    name: ANALYTICS_EVENT_NAMES.RESERVATION_COMPLETED,
    params: { source: "reservation_form", ...params },
  });
}

/**
 * @param {Record<string, string | number | boolean | undefined>} [params]
 */
export function trackMenuViewed(params = {}) {
  trackEvent({
    name: ANALYTICS_EVENT_NAMES.MENU_VIEWED,
    params: { source: "menu", ...params },
  });
}

/**
 * @param {Record<string, string | number | boolean | undefined>} [params]
 */
export function trackPhoneClicked(params = {}) {
  trackEvent({
    name: ANALYTICS_EVENT_NAMES.PHONE_CLICKED,
    params,
  });
}

/**
 * @param {Record<string, string | number | boolean | undefined>} [params]
 */
export function trackEmailClicked(params = {}) {
  trackEvent({
    name: ANALYTICS_EVENT_NAMES.EMAIL_CLICKED,
    params,
  });
}

/**
 * @param {Record<string, string | number | boolean | undefined>} [params]
 */
export function trackDirectionsClicked(params = {}) {
  trackEvent({
    name: ANALYTICS_EVENT_NAMES.DIRECTIONS_CLICKED,
    params,
  });
}

/**
 * @param {Record<string, string | number | boolean | undefined>} [params]
 */
export function trackContactFormSubmitted(params = {}) {
  trackEvent({
    name: ANALYTICS_EVENT_NAMES.CONTACT_FORM_SUBMITTED,
    params: { source: "contact_form", ...params },
  });
}

/**
 * @param {Record<string, string | number | boolean | undefined>} [params]
 */
export function trackNewsletterSubscribed(params = {}) {
  trackEvent({
    name: ANALYTICS_EVENT_NAMES.NEWSLETTER_SUBSCRIBED,
    params: { source: "newsletter", ...params },
  });
}

/**
 * @param {string} href
 * @returns {boolean}
 */
export function isDirectionsHref(href) {
  if (!href) return false;
  try {
    const url = new URL(href, "https://latablemarine.com");
    return (
      url.pathname.includes("/maps/dir") ||
      (url.hostname.includes("google.") && url.searchParams.has("destination"))
    );
  } catch {
    return href.includes("/maps/dir") || href.includes("destination=");
  }
}

/**
 * @param {string} href
 * @returns {boolean}
 */
export function isMenuHref(href) {
  if (!href) return false;
  return href.includes("/api/menu/file") || href === "/menu" || href.endsWith("/menu");
}

/**
 * @param {HTMLElement} anchor
 * @returns {string}
 */
export function getLinkLocation(anchor) {
  const labelled = anchor.closest("[aria-label]");
  if (labelled?.getAttribute("aria-label")) {
    return labelled.getAttribute("aria-label") || "unknown";
  }

  const section = anchor.closest("section[id], header, footer, nav");
  if (section?.id) return section.id;
  if (section?.tagName === "HEADER") return "header";
  if (section?.tagName === "FOOTER") return "footer";
  if (section?.tagName === "NAV") return "navigation";

  return typeof window !== "undefined" ? window.location.pathname : "unknown";
}
