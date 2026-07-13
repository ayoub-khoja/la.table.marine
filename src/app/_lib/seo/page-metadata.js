import { buildPageMetadata } from "./metadata";
import { isNoindexPublicRoute } from "./routes";

/** @type {Record<string, { title: string, description: string, path: string, noindex?: boolean }>} */
export const PAGE_SEO = {
  home: {
    title: "La Table Marine | Restaurant de poissons et fruits de mer à Plaisir",
    description:
      "Découvrez La Table Marine, restaurant de poissons et fruits de mer à Plaisir. Produits frais, cuisine raffinée et ambiance chaleureuse. Réservez votre table.",
    path: "/",
  },
  about: {
    title: "Notre restaurant de fruits de mer à Plaisir",
    description:
      "Découvrez l'histoire, l'équipe et la cuisine de La Table Marine, restaurant de poissons et fruits de mer au cœur de Plaisir dans les Yvelines.",
    path: "/about",
  },
  aboutChef: {
    title: "Le chef et la cuisine",
    description:
      "Rencontrez le chef de La Table Marine et sa vision d'une cuisine de la mer raffinée, entre produits frais et savoir-faire.",
    path: "/about-chef",
  },
  history: {
    title: "L'histoire du restaurant",
    description:
      "L'histoire de La Table Marine, restaurant de fruits de mer et cuisine du terroir à Plaisir, dans les Yvelines.",
    path: "/history",
  },
  services: {
    title: "Services et expériences",
    description:
      "Privatisation, événements et services proposés par La Table Marine, restaurant de poissons et fruits de mer à Plaisir.",
    path: "/services",
  },
  contact: {
    title: "Contact et accès",
    description:
      "Contactez La Table Marine à Plaisir : adresse, téléphone, e-mail, horaires et itinéraire pour rejoindre notre restaurant.",
    path: "/contact",
  },
  reservation: {
    title: "Réserver une table",
    description:
      "Réservez votre table à La Table Marine, restaurant de poissons et fruits de mer situé à Plaisir dans les Yvelines.",
    path: "/reservation",
  },
  menu: {
    title: "Carte et menu",
    description:
      "Consultez la carte de La Table Marine à Plaisir : poissons frais, fruits de mer, viandes et suggestions préparées avec soin.",
    path: "/menu",
  },
  restaurantVideo: {
    title: "Découvrir La Table Marine en vidéo",
    description:
      "Regardez la vidéo de présentation de La Table Marine, restaurant de poissons et fruits de mer à Plaisir, et découvrez l'ambiance de notre établissement.",
    path: "/decouvrir-le-restaurant-en-video",
  },
  blog: {
    title: "Blog",
    description:
      "Actualités, recettes et coulisses de La Table Marine, restaurant de fruits de mer à Plaisir.",
    path: "/blog",
  },
  privacy: {
    title: "Politique de confidentialité",
    description:
      "Politique de confidentialité et protection des données personnelles — La Table Marine.",
    path: "/politique-de-confidentialite",
  },
  cookies: {
    title: "Politique de cookies",
    description:
      "Informations sur l'utilisation des cookies et le consentement sur le site La Table Marine.",
    path: "/politique-de-cookies",
  },
  notFound: {
    title: "Page introuvable",
    description: "La page demandée est introuvable sur le site La Table Marine.",
    path: "/404",
    noindex: true,
  },
  home2: { title: "Accueil — variante image", description: "Variante de démonstration non indexée.", path: "/home-2", noindex: true },
  home3: { title: "Accueil — variante vidéo", description: "Variante de démonstration non indexée.", path: "/home-3", noindex: true },
  onepage: { title: "Accueil one page", description: "Variante de démonstration non indexée.", path: "/onepage", noindex: true },
  menu2: { title: "Menu — variante", description: "Variante de démonstration non indexée.", path: "/menu-2", noindex: true },
  reservation2: { title: "Réservation OpenTable", description: "Variante de démonstration non indexée.", path: "/reservation-2", noindex: true },
  shop: { title: "Boutique", description: "Boutique — page template non publiée.", path: "/shop", noindex: true },
  products: { title: "Produits", description: "Liste produits — page template non publiée.", path: "/products", noindex: true },
  product: { title: "Fiche produit", description: "Fiche produit — page template non publiée.", path: "/product", noindex: true },
  cart: { title: "Panier", description: "Panier — page utilitaire non indexée.", path: "/cart", noindex: true },
  checkout: { title: "Commande", description: "Commande — page utilitaire non indexée.", path: "/checkout", noindex: true },
  search: { title: "Recherche", description: "Résultats de recherche internes non indexés.", path: "/search", noindex: true },
};

/**
 * @param {keyof typeof PAGE_SEO} key
 */
export function getPageMetadata(key) {
  const page = PAGE_SEO[key];
  if (!page) {
    throw new Error(`SEO metadata introuvable pour la clé "${key}"`);
  }

  return buildPageMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    noindex: page.noindex || isNoindexPublicRoute(page.path),
    nofollow: page.noindex || isNoindexPublicRoute(page.path),
  });
}

/**
 * @param {object} input
 * @param {string} input.title
 * @param {string} input.description
 * @param {string} input.path
 */
export function buildDynamicPageMetadata({ title, description, path }) {
  return buildPageMetadata({ title, description, path });
}
