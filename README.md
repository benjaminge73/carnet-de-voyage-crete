# Carnet de voyage Crète

Application **Next.js (App Router)**, mobile-first : un journal de voyage avec
galerie photos et carte interactive. Tour de l'île de Crète sur 10 jours, jour
par jour, lieu par lieu.

> Les données du voyage (`src/data/trip.data.ts`, `src/data/photos.json`) sont
> fournies à titre de démonstration. Remplacez-les par les vôtres.

## Stack

- **Next.js 14/15** (App Router, SSG)
- **React 19**
- **Leaflet** (carte interactive, chargée dynamiquement côté client)
- **Vitest** (tests unitaires) + **Playwright** (smoke e2e)

## Démarrer

```bash
npm install
npm run dev          # http://localhost:3000
```

Autres commandes :

```bash
npm run build        # build de production
npm test             # tests unitaires (Vitest)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

## Hébergement des photos

Les médias ne sont pas inclus dans le dépôt. Les URLs de `src/data/photos.json`
sont de la forme `/photos/<...>` et sont résolues à l'exécution :

- **En local** : placez vos fichiers dans `public/photos/` ; ils sont servis à
  `/photos/*`.
- **En production** : définissez `NEXT_PUBLIC_PHOTOS_BASE_URL` (ex. le domaine
  d'un object store type Cloudflare R2). Les chemins `/photos/*` sont alors
  réécrits vers ce domaine, et un redimensionnement à la volée façon
  Cloudflare Image Resizing (`/cdn-cgi/image/...`) est appliqué quand l'hôte
  correspond. Voir `src/lib/photos/url.ts`.

| Variable | Rôle | Défaut |
|---|---|---|
| `NEXT_PUBLIC_PHOTOS_BASE_URL` | Domaine servant les photos | `https://photos.example.com` (placeholder) |
| `NEXT_PUBLIC_VARIANT` | `full` ou `portfolio` | `full` |

> `NEXT_PUBLIC_*` est figé au build : changez la variable puis rebuildez.

## Variantes du site

Le même code produit deux variantes via `NEXT_PUBLIC_VARIANT` :

- **`full`** (défaut) : carnet complet, toutes les photos visibles.
- **`portfolio`** : version publique « book », où **toute photo marquée
  `family: true` dans `photos.json` est filtrée partout** (grilles, hero, carte,
  lightbox, compteurs). Le filtre est appliqué au seul point d'entrée des
  données, `src/lib/photos/selector.ts` (`applyVariantFilter`).

```bash
NEXT_PUBLIC_VARIANT=portfolio npm run dev    # prévisualiser la variante portfolio
NEXT_PUBLIC_VARIANT=portfolio npm test
```

La CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) lance lint /
typecheck / test / build pour les deux variantes en matrice.

## Structure

| Chemin | Rôle |
|---|---|
| `src/app/` | Pages (App Router) : accueil, fiche jour, fiche lieu, carte, lightbox |
| `src/components/` | Composants UI (`<Photo>`, `<PhotoGrid>`, carte Leaflet, …) |
| `src/data/trip.data.ts` | Itinéraire : jours, lieux, GPS |
| `src/data/photos.json` | Métadonnées photos (clé = `placeId`) avec champ `family?` |
| `src/lib/photos/` | Résolution d'URL, sélection, filtre de variante, hero |
| `scripts/` | Outils de préparation des données (EXIF, upload object store, clustering, tagging visages) |

## Scripts de données (optionnels)

Les scripts sous `scripts/` aident à (re)générer `photos.json` et à téléverser
les médias vers un object store compatible S3. Ils lisent leur configuration
depuis l'environnement :

```bash
# Object store compatible S3 (ex. Cloudflare R2)
export R2_ACCESS_KEY_ID=...
export R2_SECRET_ACCESS_KEY=...
export R2_ACCOUNT_ID=...
export R2_BUCKET=mon-bucket          # défaut : "travel-photos"

node scripts/extract-exif.mjs        # génère src/data/photos.json depuis les EXIF
node scripts/upload-r2.mjs           # téléverse public/photos/ vers l'object store
```

## Licence

Aucune licence n'est fournie : tous droits réservés par défaut. Ajoutez un
fichier `LICENSE` si vous souhaitez ouvrir la réutilisation.
