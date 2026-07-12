# Tableau de bord Analytics — La Table Marine

Ce guide explique comment connecter le tableau de bord administrateur à Google Analytics 4 via la **Google Analytics Data API**.

> Les clés du compte de service ne doivent **jamais** être commitées dans le dépôt Git.

## Architecture

```
src/app/_lib/analytics/
  ga4-config.js        # Variables d'environnement, événements
  ga4-client.js        # Client @google-analytics/data
  ga4-cache.js         # Cache mémoire (5 min / 60 s temps réel)
  ga4-periods.js       # Périodes et comparaisons
  ga4-format.js        # Formatage fr-FR
  ga4-mappers.js       # Transformation des réponses GA4
  ga4-reports.js       # Requêtes GA4 centralisées
  ga4-summary.js       # Résumé textuel local
  ga4-csv.js           # Export CSV
  operational-stats.js # Données MongoDB (séparées)
  analytics-route.js   # Helper routes API protégées
  utm-builder.js       # Générateur UTM

src/app/api/admin/analytics/
  overview, timeseries, sources, pages, devices,
  locations, events, realtime, campaigns, operational

src/app/admin/(panel)/analytics/page.jsx
src/app/_components/admin/analytics/AnalyticsDashboard.jsx
```

## Prérequis

- Propriété GA4 active avec ID de mesure `G-CZ8VZEBR4G` (déjà intégré côté site)
- Accès administrateur Google Analytics
- Accès Google Cloud Console

---

## 1. Google Cloud Console

1. Ouvrir [https://console.cloud.google.com](https://console.cloud.google.com)
2. Créer ou sélectionner un projet (ex. `la-table-marine-analytics`)
3. Menu **API et services** → **Bibliothèque**
4. Rechercher **Google Analytics Data API**
5. Cliquer **Activer**

## 2. Compte de service

1. **API et services** → **Identifiants**
2. **Créer des identifiants** → **Compte de service**
3. Nom suggéré : `latablemarine-ga4-dashboard`
4. Rôle minimal : aucun rôle GCP obligatoire pour lire GA4
5. Créer une **clé JSON** et la télécharger localement
6. Ouvrir le JSON et récupérer :
   - `client_email`
   - `private_key`

⚠️ Ne commitez **jamais** ce fichier JSON. Ajoutez-le à `.gitignore` (déjà configuré).

## 3. Accès GA4 au compte de service

1. Ouvrir [https://analytics.google.com](https://analytics.google.com)
2. **Admin** (engrenage) → **Gestion des accès à la propriété**
3. **+** → **Ajouter des utilisateurs**
4. Coller l'email du compte de service (`xxx@xxx.iam.gserviceaccount.com`)
5. Rôle : **Lecteur** ou **Analyste**
6. Enregistrer

## 4. Identifiant numérique de propriété

1. GA4 → **Admin** → **Détails de la propriété**
2. Copier l'**ID de propriété** (numérique, ex. `123456789`)
3. Ce n'est **pas** l'ID de mesure `G-XXXXXXXXXX`

## 5. Variables d'environnement

### Local (`.env.local`)

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-CZ8VZEBR4G

GA4_PROPERTY_ID=123456789
GOOGLE_SERVICE_ACCOUNT_EMAIL=votre-compte@projet.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Pour la clé privée sur Vercel, collez la valeur avec des `\n` littéraux ou une seule ligne — le code applique `.replace(/\\n/g, "\n")`.

### Vercel

1. Projet → **Settings** → **Environment Variables**
2. Ajouter les 3 variables serveur (`GA4_PROPERTY_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`)
3. **Redéployer** le projet

## 6. Vérification

1. Se connecter à `/admin`
2. Ouvrir **Statistiques** (`/admin/analytics`)
3. Vérifier l'affichage des KPI et graphiques
4. Tester **Actualiser** et la section **Temps réel**

---

## Événements GA4 recommandés (événements clés)

Marquer comme **événements clés** dans GA4 :

- `reservation_completed`
- `contact_form_submitted`

Recommandés :

- `phone_clicked`
- `directions_clicked`
- `reservation_started`
- `menu_viewed`

Ces événements sont déjà préparés dans `src/app/_lib/cookies/consent-config.js` et `analytics.js`.

---

## Cache

| Type | Durée |
|------|-------|
| Rapports standards | 5 minutes |
| Temps réel | 60 secondes |

Ajouter `?refresh=1` à une requête API pour forcer l'actualisation.

---

## Limitations

- Données agrégées uniquement (pas de données personnelles)
- Quotas Google Analytics Data API (10 000 requêtes/jour/propriété en gratuit)
- Le temps réel GA4 couvre ~30 minutes
- Sans configuration serveur, le dashboard affiche un message explicite sans planter le site

---

## Dépannage

| Problème | Solution |
|----------|----------|
| « Non configuré » | Vérifier les 3 variables d'environnement |
| 403 Google | Vérifier l'accès Lecteur du service account dans GA4 |
| Événements à 0 | Vérifier le consentement cookies + DebugView GA4 |
| Timeout | Réessayer ; vérifier les quotas API |

---

## Points juridiques

- Le dashboard admin est réservé aux utilisateurs authentifiés
- Aucune donnée personnelle n'est affichée
- Les données MongoDB et GA4 sont clairement séparées dans l'interface
