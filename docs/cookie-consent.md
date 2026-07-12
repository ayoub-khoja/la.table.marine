# Cookie consent — La Table Marine

> Ce contenu constitue une base technique et doit être validé juridiquement par le responsable du site.

## Architecture

Le système repose sur une architecture modulaire :

```
src/app/_lib/cookies/
  consent-types.js      # Types JSDoc
  consent-config.js     # Catégories, version, durée, événements GA
  consent-storage.js    # Lecture/écriture du consentement (cookie first-party)
  google-consent.js     # Google Consent Mode v2 (default + update)
  analytics.js          # Chargement GA4 (Basic Consent Mode) + trackEvent
  cleanup-cookies.js    # Suppression des cookies Analytics/Marketing
  use-external-media.js # Hook pour Google Maps et contenus tiers

src/app/_components/cookies/
  CookieConsentProvider.jsx
  CookieConsentRoot.jsx
  CookieConsentManager.jsx
  CookieConsentRouteTracker.jsx
  CookieBanner.jsx
  CookiePreferencesModal.jsx
  CookieSettingsButton.jsx
  CookieCategoryToggle.jsx
  GoogleAnalyticsConsent.jsx  # Documentation Advanced vs Basic mode
```

## Fonctionnement

1. Au chargement, un script `beforeInteractive` définit le consentement Google par défaut (`denied` pour analytics/ads).
2. Le provider lit le cookie `ltm_cookie_consent` côté client uniquement.
3. Si absent, expiré ou version obsolète → bannière affichée.
4. L'utilisateur accepte, refuse ou personnalise → choix sauvegardé 6 mois.
5. GA4 n'est chargé qu'après acceptation Analytics (Basic Consent Mode).
6. Retrait du consentement → `analytics_storage: denied`, script GA retiré, cookies `_ga*` supprimés.

## Ajouter l'identifiant GA4

Dans `.env.local` :

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Redémarrer le serveur de développement après modification.

## Ajouter une nouvelle catégorie

1. Ajouter l'entrée dans `COOKIE_CATEGORIES` (`consent-config.js`).
2. Étendre `CookieConsent` et `createConsentObject()` (`consent-storage.js`).
3. Mettre à jour `getGoogleConsentUpdate()` si la catégorie impacte Google Consent Mode.
4. Ajouter un interrupteur dans `CookiePreferencesModal.jsx`.
5. Incrémenter `CONSENT_VERSION` pour redemander le consentement.

## Ajouter un nouveau service

1. Ajouter une entrée dans `COOKIE_SERVICE_DETAILS` (`consent-config.js`).
2. Créer la logique de chargement conditionnel dans le composant concerné.
3. Ajouter la suppression des cookies dans `cleanup-cookies.js` si nécessaire.

## Ajouter un événement Analytics

```javascript
import { trackEvent, ANALYTICS_EVENT_NAMES } from "@library/cookies/analytics";

trackEvent({
  name: ANALYTICS_EVENT_NAMES.RESERVATION_STARTED,
  params: { source: "homepage" },
});
```

Ne jamais inclure de données personnelles dans `params`.

## Tester

```bash
npm run test
npm run lint
npm run build
```

### Vérification manuelle (Chrome DevTools)

1. **Navigation privée** — première visite :
   - Bannière visible
   - Application > Cookies : pas de `_ga`
   - Network : pas de requêtes vers `google-analytics.com`, `googletagmanager.com`, `g/collect`

2. **Tout refuser** :
   - Cookie `ltm_cookie_consent` présent avec `analytics: false`
   - Pas de script GA actif

3. **Tout accepter** (avec `NEXT_PUBLIC_GA_MEASUREMENT_ID` défini) :
   - Script `gtag/js` chargé une fois
   - Cookie `_ga` peut apparaître
   - Consent Mode : `analytics_storage: granted`

4. **Retrait via « Gérer mes cookies »** :
   - Analytics bloqué immédiatement
   - Cookies `_ga` / `_ga_*` supprimés si possible

5. **Google Tag Assistant** — vérifier les états :
   - `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`

## Changer la durée de conservation

Modifier `CONSENT_DURATION_MS` dans `consent-config.js` (actuellement 6 mois).

## Changer la version de politique

Incrémenter `CONSENT_VERSION` dans `consent-config.js`. Tous les utilisateurs verront à nouveau la bannière.

## Désactiver totalement Analytics

- Retirer ou laisser vide `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- Aucun script GA ne sera chargé, même si l'utilisateur accepte Analytics.

## Retirer un service

1. Supprimer le chargement conditionnel du composant.
2. Retirer l'entrée de `COOKIE_SERVICE_DETAILS`.
3. Ajouter le nettoyage des cookies associés dans `cleanup-cookies.js`.

## Limites techniques

- La suppression des cookies tiers (domaine Google) depuis le site first-party est limitée ; seuls les cookies accessibles sur le domaine du site sont supprimés.
- Le Basic Consent Mode ne charge pas GA avant consentement : pas de ping cookieless.
- Pas de CSP configurée actuellement ; si une CSP est ajoutée, autoriser `https://www.googletagmanager.com` et `https://www.google-analytics.com` uniquement si Analytics est activé.

## Points juridiques à valider

- Identité du responsable de traitement et mentions légales
- Hébergeur
- DPO le cas échéant
- Textes des politiques de confidentialité et cookies
- Durées de conservation des données formulaires
