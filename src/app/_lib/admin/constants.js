export const ADMIN_SESSION_COOKIE = "admin_session";

export const ADMIN_LOGIN_PATH = "/admin";

export const ADMIN_DEFAULT_REDIRECT = "/admin/dashboard";

export const ADMIN_PROTECTED_PATHS = [
  "/admin/dashboard",
  "/admin/analytics",
  "/admin/commandes",
  "/admin/reservations",
  "/admin/messages",
  "/admin/produits",
  "/admin/menu",
  "/admin/avis",
];

export const ADMIN_NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    href: "/admin/dashboard",
    icon: "fa-chart-line",
  },
  {
    id: "analytics",
    label: "Statistiques",
    href: "/admin/analytics",
    icon: "fa-chart-bar",
  },
  {
    id: "commandes",
    label: "Commande",
    href: "/admin/commandes",
    icon: "fa-shopping-bag",
  },
  {
    id: "reservations",
    label: "Réservation",
    href: "/admin/reservations",
    icon: "fa-calendar-check",
  },
  {
    id: "messages",
    label: "Message",
    href: "/admin/messages",
    icon: "fa-envelope",
  },
  {
    id: "produits",
    label: "Notre carte",
    href: "/admin/produits",
    icon: "fa-box",
  },
  {
    id: "menu",
    label: "Menu",
    href: "/admin/menu",
    icon: "fa-utensils",
  },
  {
    id: "avis",
    label: "Avis clients",
    href: "/admin/avis",
    icon: "fa-star",
  },
];

export const SESSION_MAX_AGE_DEFAULT = 60 * 60 * 8; // 8 h
export const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 7; // 7 j

export const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
};
