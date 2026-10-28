import { canUseMarketing, loadConsent } from "./consent-storage";

/**
 * Meta Pixel — chargé uniquement après consentement « Marketing ».
 *
 * - Aucun script ni requête vers Meta avant consentement (pas de <noscript> fallback :
 *   sans JavaScript, le consentement ne peut pas être recueilli).
 * - Le PageView initial est envoyé par nous. Les changements de page Next.js sont
 *   suivis par le listener history de fbevents.js (pushState / replaceState / popstate).
 *   Un second fbq('track','PageView') manuel est ignoré par le pixel tant que ce
 *   listener est désactivé, donc disablePushState n'est pas utilisé.
 * - Lead envoyé uniquement avec un identifiant d'événement renvoyé par l'API après
 *   enregistrement de la réservation en base.
 */

export const META_PIXEL_ID = "1826056291860129";
export const META_PIXEL_SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";

const SCRIPT_ATTRIBUTE = "data-ltm-meta-pixel";
const LEAD_STORAGE_KEY = "ltm_meta_lead_ids";
const MAX_STORED_LEAD_IDS = 20;
const EVENT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEAD_REQUEST_TYPES = new Set(["reservation", "autre"]);

/** @type {string | null} */
let initializedPixelId = null;
/** @type {string | null} */
let lastPageViewKey = null;
/** @type {Set<string>} */
const trackedLeadIds = new Set();

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * @returns {boolean}
 */
export function isMetaPixelAllowed() {
  return canUseMarketing(loadConsent());
}

/**
 * @returns {boolean}
 */
export function isMetaPixelLoaded() {
  return initializedPixelId !== null;
}

/**
 * @param {...unknown} args
 * @returns {boolean}
 */
function callFbq(...args) {
  const fbq = isBrowser() ? window.fbq : undefined;
  if (typeof fbq !== "function") return false;

  try {
    fbq(...args);
    return true;
  } catch {
    return false;
  }
}

function installFbqStub() {
  if (typeof window.fbq === "function") return;

  const fbq = function fbq() {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, arguments);
    } else {
      fbq.queue.push(arguments);
    }
  };
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
}

/**
 * Charge et initialise le Pixel (idempotent). Ne fait rien sans consentement marketing.
 * @param {string} [pixelId]
 * @returns {boolean} true si le Pixel est initialisé
 */
export function loadMetaPixel(pixelId = META_PIXEL_ID) {
  if (!isBrowser() || !pixelId) return false;
  if (!isMetaPixelAllowed()) return false;
  if (initializedPixelId === pixelId) return true;

  installFbqStub();

  if (!document.querySelector(`script[${SCRIPT_ATTRIBUTE}]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = META_PIXEL_SCRIPT_SRC;
    script.setAttribute(SCRIPT_ATTRIBUTE, pixelId);
    document.head.appendChild(script);
  }

  // Empêche la collecte automatique (clics, métadonnées de formulaire).
  callFbq("set", "autoConfig", false, pixelId);
  callFbq("init", pixelId);
  initializedPixelId = pixelId;
  return true;
}

/**
 * Coupe le Pixel après retrait du consentement.
 * Le code fbevents.js déjà exécuté ne peut pas être déchargé : si le Pixel était actif,
 * l'appelant doit recharger la page.
 * @returns {{ reloadRequired: boolean }}
 */
export function disableMetaPixel() {
  if (!isBrowser()) return { reloadRequired: false };

  const wasLoaded = initializedPixelId !== null;

  if (wasLoaded) {
    callFbq("consent", "revoke");
  }

  document
    .querySelectorAll(`script[${SCRIPT_ATTRIBUTE}]`)
    .forEach((script) => script.remove());

  initializedPixelId = null;
  lastPageViewKey = null;
  trackedLeadIds.clear();
  try {
    window.sessionStorage.removeItem(LEAD_STORAGE_KEY);
  } catch {
    // sessionStorage indisponible (navigation privée stricte, etc.)
  }

  return { reloadRequired: wasLoaded };
}

/**
 * Envoie un PageView, une seule fois par URL consécutive (Strict Mode, re-rendus).
 * @param {string} pageKey chemin + query string
 * @returns {boolean}
 */
export function trackMetaPageView(pageKey) {
  if (!pageKey) return false;
  if (!isMetaPixelAllowed() || !isMetaPixelLoaded()) return false;
  if (pageKey === lastPageViewKey) return false;

  lastPageViewKey = pageKey;
  return callFbq("track", "PageView");
}

/**
 * Extrait l'identifiant d'événement Lead d'une réponse /api/reservation
 * uniquement si l'API confirme l'enregistrement en base.
 * @param {boolean} responseOk
 * @param {unknown} data
 * @returns {string | null}
 */
export function getReservationLeadEventId(responseOk, data) {
  if (!responseOk || !data || typeof data !== "object") return null;
  if (data.success !== true || data.reservationSaved !== true) return null;

  const id = data.trackingEventId;
  return typeof id === "string" && EVENT_ID_RE.test(id) ? id : null;
}

/**
 * @returns {string[]}
 */
function readStoredLeadIds() {
  try {
    const raw = window.sessionStorage.getItem(LEAD_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} eventId
 */
function rememberLeadId(eventId) {
  trackedLeadIds.add(eventId);
  try {
    const ids = [...readStoredLeadIds().filter((id) => id !== eventId), eventId];
    window.sessionStorage.setItem(
      LEAD_STORAGE_KEY,
      JSON.stringify(ids.slice(-MAX_STORED_LEAD_IDS))
    );
  } catch {
    // La déduplication en mémoire reste active.
  }
}

/**
 * @param {string} eventId
 * @returns {boolean}
 */
function hasTrackedLead(eventId) {
  return trackedLeadIds.has(eventId) || readStoredLeadIds().includes(eventId);
}

/**
 * Envoie l'événement Lead pour une réservation enregistrée. Ne lève jamais d'erreur.
 * Aucune donnée personnelle n'est transmise : seul un identifiant aléatoire (eventID)
 * et le type de demande sont envoyés.
 * @param {{ eventId: string, requestType?: string }} input
 * @returns {boolean} true si l'appel fbq a été effectué
 */
export function trackMetaLead({ eventId, requestType } = {}) {
  try {
    if (!isBrowser()) return false;
    if (typeof eventId !== "string" || !EVENT_ID_RE.test(eventId)) return false;
    if (!isMetaPixelAllowed() || !isMetaPixelLoaded()) return false;
    if (hasTrackedLead(eventId)) return false;

    rememberLeadId(eventId);

    /** @type {Record<string, string>} */
    const params = { content_name: "reservation_request" };
    if (requestType && LEAD_REQUEST_TYPES.has(requestType)) {
      params.content_category = requestType;
    }

    return callFbq("track", "Lead", params, { eventID: eventId });
  } catch {
    return false;
  }
}

/**
 * Réinitialise l'état interne (tests uniquement).
 */
export function resetMetaPixelStateForTests() {
  initializedPixelId = null;
  lastPageViewKey = null;
  trackedLeadIds.clear();
}
