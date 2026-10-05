# Menu PDF permanent & QR code

## Principe

Le QR code et l’URL publique restent **toujours** :

`https://latablemarine.com/menu`

Cette URL ne pointe jamais vers le nom physique du PDF. L’application résout le menu **actif** en base MongoDB, puis sert le fichier (GridFS en production Vercel, disque en local).

```text
QR permanent → /menu → menu actif MongoDB → PDF courant
```

## Importer le premier menu

1. Connectez-vous à `/admin`
2. Ouvrez **Menu PDF & QR code** (`/admin/menu`)
3. Sélectionnez un PDF (max. 15 Mo)
4. Cliquez sur **Publier le menu PDF**

## Remplacer le menu

1. Dans `/admin/menu`, sélectionnez le nouveau PDF
2. Confirmez le remplacement
3. Les clients voient immédiatement le nouveau fichier via la **même** URL `/menu`

Le QR code **n’est pas régénéré** (son contenu ne change pas).

## Pourquoi le QR reste identique

Le QR encode uniquement l’URL permanente `/menu`, jamais :

- le nom du fichier (`menu-aout-2026.pdf`)
- une URL GridFS / Blob signée
- un paramètre de version

Seul le document MongoDB `carte-menu` (référence active) change.

## Télécharger le QR code

Dans `/admin/menu` :

- **Carton PNG** → `qr-menu-la-table-marine.png` (2400 × 3400 px, prêt à imprimer)  
  Style affiche : fond marine, « SCANNEZ », cadre viewfinder, logo La Table Marine
- **SVG** → `qr-menu-la-table-marine.svg` (même design, vectoriel)
- **PNG compact** → QR carré + logo central (usage technique)

Imprimez-le une seule fois ; il reste valide après chaque remplacement de PDF.
L’URL encodée reste toujours `/menu`.

Les illustrations poisson/moule proviennent de [Game Icons](https://game-icons.net) (CC BY 3.0).

## Vérifier que le nouveau PDF est publié

1. Ouvrez `https://latablemarine.com/menu` (ou `http://localhost:3000/menu`)
2. Contrôlez l’aperçu dans l’admin
3. Vérifiez la date de mise à jour et le numéro de version affichés

Astuce : utilisez une navigation privée pour éviter un cache navigateur local.

## Désactiver / republier

- **Désactiver** : `/menu` affiche un message professionnel ; le QR reste valide
- **Publier** : le même PDF redevient accessible immédiatement

## Restaurer l’ancien menu en cas de problème

1. Réimportez l’ancien fichier PDF depuis `/admin/menu` (gardez une copie locale des PDF publiés)
2. Ou republiez via **Publier** si vous aviez seulement désactivé le menu

Le remplacement est atomique côté référence : si l’import échoue, l’ancien menu actif reste en ligne.

## Variables d’environnement

```env
SITE_URL=https://latablemarine.com
NEXT_PUBLIC_SITE_URL=https://latablemarine.com
MONGODB_URI=...
```

En local :

```env
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## URLs utiles

| URL | Accès |
|---|---|
| `/menu` | Public, permanent (QR) |
| `/api/menu/file` | Livraison du PDF actif |
| `/admin/menu` | Administration |
| `/api/admin/menu/qr?format=png` | Téléchargement QR (admin) |
