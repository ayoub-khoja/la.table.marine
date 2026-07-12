/** @type {import('./consent-types').CookieCategoryDefinition[]} */
export const COOKIE_CATEGORIES = [
  {
    id: "necessary",
    name: "Cookies strictement nécessaires",
    description:
      "Indispensables au fonctionnement du site : sécurité, formulaires, réservation et mémorisation de vos préférences de cookies.",
    required: true,
    defaultEnabled: true,
  },
  {
    id: "analytics",
    name: "Mesure d'audience",
    description:
      "Nous permet de comprendre comment le site est utilisé (pages consultées, navigation) afin d'améliorer l'expérience. Google Analytics 4.",
    required: false,
    defaultEnabled: false,
  },
  {
    id: "marketing",
    name: "Marketing",
    description:
      "Prévu pour de futurs outils publicitaires (Meta Pixel, Google Ads, etc.). Aucun outil marketing n'est actuellement actif.",
    required: false,
    defaultEnabled: false,
  },
  {
    id: "externalMedia",
    name: "Contenus externes",
    description:
      "Services tiers intégrés au site, comme Google Maps. Ils peuvent déposer des cookies ou collecter des données lors de leur chargement.",
    required: false,
    defaultEnabled: false,
  },
];

/** @type {import('./consent-types').CookieServiceDetail[]} */
export const COOKIE_SERVICE_DETAILS = [
  {
    name: "ltm_cookie_consent",
    purpose: "Mémoriser vos préférences de consentement aux cookies",
    provider: "La Table Marine (first-party)",
    duration: "6 mois",
    categoryId: "necessary",
  },
  {
    name: "admin_session",
    purpose: "Session d'administration du site (espace admin uniquement)",
    provider: "La Table Marine (first-party)",
    duration: "Session ou 30 jours (selon connexion)",
    categoryId: "necessary",
  },
  {
    name: "_ga",
    purpose: "Distinguer les utilisateurs pour la mesure d'audience",
    provider: "Google Analytics",
    duration: "2 ans",
    categoryId: "analytics",
  },
  {
    name: "_ga_*",
    purpose: "Conserver l'état de session GA4",
    provider: "Google Analytics",
    duration: "2 ans",
    categoryId: "analytics",
  },
  {
    name: "Google Maps (iframe)",
    purpose: "Affichage de la carte interactive et localisation du restaurant",
    provider: "Google Ireland Limited",
    duration: "Variable (selon Google)",
    categoryId: "externalMedia",
  },
];

export const CONSENT_COOKIE_NAME = "ltm_cookie_consent";
export const CONSENT_VERSION = "1.0";
export const CONSENT_DURATION_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export const ANALYTICS_EVENT_NAMES = {
  RESERVATION_STARTED: "reservation_started",
  RESERVATION_COMPLETED: "reservation_completed",
  MENU_VIEWED: "menu_viewed",
  PHONE_CLICKED: "phone_clicked",
  EMAIL_CLICKED: "email_clicked",
  DIRECTIONS_CLICKED: "directions_clicked",
  CONTACT_FORM_SUBMITTED: "contact_form_submitted",
  NEWSLETTER_SUBSCRIBED: "newsletter_subscribed",
};

export const PRIVACY_POLICY_PATH = "/politique-de-confidentialite";
export const COOKIE_POLICY_PATH = "/politique-de-cookies";
