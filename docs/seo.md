# SEO — La Table Marine

Documentation de l'architecture SEO technique, locale et éditoriale du site [latablemarine.com](https://latablemarine.com).

## Architecture

```
src/app/_lib/seo/
  config.js          # Données NAP, horaires, URLs canoniques
  metadata.js        # Helpers Metadata API Next.js
  page-metadata.js   # Titles/descriptions par page
  routes.js          # Routes indexables / noindex / robots
  json-ld.js         # Schémas Schema.org

src/app/_components/seo/
  JsonLd.jsx         # Injection JSON-LD sécurisée
  SeoPageJsonLd.jsx  # Breadcrumb + WebPage par page

src/app/robots.js    # robots.txt dynamique
src/app/sitemap.js   # sitemap.xml dynamique
```

## Configuration centrale

Source unique : `src/app/_lib/seo/config.js`

| Champ | Valeur actuelle |
|-------|-----------------|
| URL canonique | `https://latablemarine.com` |
| Nom | La Table Marine |
| Téléphone | `01 88 93 76 72` (`+33188937672`) |
| E-mail | `contact@latablemarine.com` |
| Adresse | `2 rue Pierre Curie, 78370 Plaisir` |
| Menu | `/menu` → PDF `/api/menu/file` |
| Réservation | `/reservation` |

### TODO à confirmer

- **Profils sociaux réels** : renseigner `SEO_CONFIG.socialProfiles` (actuellement vide — les liens `app.json` sont des placeholders).
- **Google Search Console** : ajouter `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` dans Vercel si vous souhaitez la validation automatique.
- **Google Business Profile** : harmoniser nom, adresse, téléphone et horaires avec `config.js`.
- **Images Open Graph dédiées** : créer des visuels 1200×630 par page (menu, réservation) — actuellement `/img/image00015.png` sert d'image par défaut.
- **Modes de paiement** : `paymentAccepted` non renseigné tant que non confirmé sur le site.

## Métadonnées par page

Définies dans `page-metadata.js` et appliquées via `getPageMetadata()` ou `buildDynamicPageMetadata()`.

| Page | Title | Index |
|------|-------|-------|
| `/` | La Table Marine \| Restaurant de poissons et fruits de mer à Plaisir | oui |
| `/about` | Notre restaurant de fruits de mer à Plaisir | oui |
| `/contact` | Contact et accès | oui |
| `/reservation` | Réserver une table | oui |
| `/menu` | Carte et menu | oui |
| `/politique-de-*` | Pages légales | oui |
| `/home-2`, `/home-3`, `/onepage` | Variantes démo | **noindex** |
| `/shop`, `/cart`, `/checkout` | E-commerce template | **noindex** |
| `/admin/*` | Administration | **noindex** |

Chaque page indexable possède : title unique, description unique, canonical absolue, Open Graph et Twitter Card.

## robots.txt

`src/app/robots.js` autorise le site public, bloque `/admin` et `/api`, référence `https://latablemarine.com/sitemap.xml`.

> robots.txt n'est pas un mécanisme de sécurité. L'admin reste protégé par l'authentification.

## sitemap.xml

`src/app/sitemap.js` inclut les pages publiques indexables et les articles de blog (`src/data/posts/*.md`).

Exclut : admin, API, pages noindex, URLs avec paramètres de pagination blog (`/blog/page/2` volontairement exclu — canonical sur `/blog`).

## JSON-LD

Sérialisation sécurisée via `serializeJsonLd()` (`<` → `\u003c`).

| Page | Schémas |
|------|---------|
| Accueil | Restaurant, Organization, WebSite, WebPage |
| Contact, menu | WebPage, BreadcrumbList, Restaurant |
| Autres | WebPage, BreadcrumbList |

**Interdit** : faux avis, `aggregateRating` inventé, fausses récompenses.

## Mots-clés prioritaires

À intégrer naturellement dans les contenus (sans keyword stuffing) :

- restaurant fruits de mer Plaisir
- restaurant poisson Plaisir
- fruits de mer Yvelines
- La Table Marine Plaisir
- réserver restaurant Plaisir

## Search Console

1. Créer une propriété pour `https://latablemarine.com`.
2. Vérifier via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` ou balise HTML.
3. Soumettre `https://latablemarine.com/sitemap.xml`.
4. Inspecter les URLs clés : `/`, `/contact`, `/reservation`, `/menu`.
5. Lier Search Console à GA4 (Admin GA4 → Associations de produits).

## Google Business Profile

Vérifier la cohérence NAP avec `config.js` :

- Nom : La Table Marine
- Adresse : 2 rue Pierre Curie, 78370 Plaisir
- Téléphone : 01 88 93 76 72
- Site : https://latablemarine.com
- Horaires : voir `schedule.json`

## Tests

```bash
npm run test
npm run seo:audit
npm run build
```

Vérifications manuelles recommandées :

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- Facebook Sharing Debugger / LinkedIn Post Inspector

## Ajouter une nouvelle page publique

1. Créer l'entrée dans `PAGE_SEO` (`page-metadata.js`).
2. Exporter `metadata = getPageMetadata("maCle")` dans `page.jsx`.
3. Ajouter la route dans `INDEXABLE_STATIC_ROUTES` si indexable.
4. Optionnel : `<SeoPageJsonLd pageKey="maCle" />`.
5. Lancer `npm run seo:audit` et `npm run build`.

## Suivi mensuel

- Erreurs d'indexation (Search Console)
- Pages avec impressions mais CTR faible → retravailler title/description
- Core Web Vitals (PageSpeed)
- Cohérence NAP si changement d'horaires/adresse
- Nouveaux contenus blog → vérifier `generateMetadata`

## Limites

- Le blog contient encore du contenu template (Lorem ipsum) — à remplacer pour un SEO éditorial optimal.
- Les variantes `/home-2`, `/home-3`, `/onepage` restent accessibles mais en noindex.
- Pas de promesse de positionnement Google.
- Pas de pages satellites ni de contenu caché.
