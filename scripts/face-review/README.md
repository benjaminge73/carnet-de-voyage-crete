# Face review tool — tagger les photos `family: true`

Outil pour identifier les photos avec une personne au premier plan (famille), qui seront masquées sur le variant portfolio (`crete.example.com`).

## Pourquoi ce workflow

- Le tagging tourne **dans le navigateur** (pas d'installation Node lourde) avec `face-api.js` chargé depuis CDN.
- La détection est rapide (~100 ms par photo sur CPU moyen) et **strictement locale** : aucune photo n'est uploadée nulle part. Les images proviennent déjà du CDN Cloudflare R2 (le navigateur les charge en thumbnail 400px).
- L'auto-tagging propose `family: true` quand le visage le plus large dépasse un seuil de surface (5% par défaut). Tu valides ou inverses en cliquant sur la vignette.
- Le tagging final est exporté en JSON, puis mergé dans `src/data/photos.json` par un script Node.

## Étapes

### 1. Ouvrir l'outil

Le HTML est statique. Plusieurs options :

```bash
# A) Via le dev server Next (recommandé, photos.json déjà accessible)
npm run dev
# puis ouvre http://localhost:3000/face-review/index.html
# … MAIS ça ne marche pas pour file:/// vu que /scripts/ n'est pas servi par Next.
# Donc utilise plutôt B :

# B) Serveur static léger sur le dossier face-review
npx http-server scripts/face-review -p 4173 -c-1
# puis ouvre http://localhost:4173/
```

> Ne pas ouvrir le fichier directement en `file://` : les requêtes vers les modèles face-api.js depuis CDN respectent CORS, mais le drop-and-drop fonctionne plus simplement via un vrai serveur HTTP.

### 2. Charger `photos.json`

Sélectionne le fichier `src/data/photos.json` via le picker en haut de la page. Toutes les photos (hors vidéos) sont listées en grille avec leur thumbnail R2.

### 3. Lancer la détection

Clique **"Détecter les visages"**. Le modèle TinyFaceDetector se charge (1ère fois ~200 KB) puis la détection s'exécute par lots de 4. Pour ~210 photos, compte environ 30–60 secondes selon ta machine.

Au fur et à mesure :
- les photos avec ratio visage/image ≥ seuil sont auto-taguées **FAMILY** (rouge)
- les autres sont **PAYSAGE** (vert)

### 4. Reviewer

Clique sur chaque vignette pour **inverser le tag**. Tu peux :
- ajuster le seuil avant de relancer la détection (utile si trop de faux positifs / négatifs)
- toujours faire une passe manuelle : un visage de profil ou en arrière-plan peut être loupé par le modèle

### 5. Exporter

Clique **"Télécharger family-tags.json"**. Le navigateur télécharge un JSON du genre :

```json
{
  "/photos/traveler-1/IMG_6830.jpeg": { "family": true, "faceRatio": 0.1834 },
  "/photos/p3b/IMG_6912.jpeg": { "family": false, "faceRatio": 0.0021 },
  ...
}
```

### 6. Appliquer dans `photos.json`

```bash
# Dry-run pour vérifier ce qui changerait
node scripts/apply-family-tags.mjs ~/Downloads/family-tags.json --dry-run

# Appliquer pour de vrai
node scripts/apply-family-tags.mjs ~/Downloads/family-tags.json
```

Le script :
- ajoute `family: true` aux photos taguées comme telles
- **retire** le champ `family` (au lieu d'écrire `family: false`) pour celles taguées paysage — garde le JSON minimal
- ne touche jamais aux photos absentes du tagging
- est idempotent : tu peux re-lancer sans risque

### 7. Vérifier + commiter

```bash
git diff src/data/photos.json | head -50
NEXT_PUBLIC_VARIANT=portfolio npm test
NEXT_PUBLIC_VARIANT=portfolio npm run dev
# ouvre / et /day/N pour confirmer que les photos famille n'apparaissent plus
git add src/data/photos.json && git commit -m "data(photos): tag family photos for portfolio variant"
```

## Limites connues

- **Visages de profil ou partiellement masqués** : TinyFaceDetector peut les manquer. Mitigation : faire la passe manuelle, c'est le but de la review.
- **Vidéos** : ignorées par l'outil. Si une vidéo doit être marquée famille, édite `photos.json` à la main.
- **Photos absentes du CDN R2** : si l'URL ne se charge pas, la photo apparaît cassée et reste taguée paysage par défaut. Re-vérifie qu'elle est bien uploadée via `node scripts/upload-r2.mjs`.
