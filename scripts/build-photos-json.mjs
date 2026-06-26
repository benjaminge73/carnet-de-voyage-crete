/**
 * Maps each cluster discovered by cluster-photos.mjs to a placeId from the new
 * trip.ts (10-day Crete trip), and writes src/data/photos.json directly from
 * the mapping. No re-running EXIF extraction needed.
 *
 * The mapping below was hand-validated by inspecting each cluster centroid on
 * Google Maps (see scripts/clusters-summary.txt) and matching it to known
 * landmarks in Crete.
 */

import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { resolve, join } from "path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

const clusters = JSON.parse(
  await readFile(join(__dirname, "clusters.json"), "utf-8")
);

// Cluster index → placeId (or "_day_N" for day-level bucket).
// Clusters are 1-indexed inside each day, matching scripts/clusters-summary.txt.
const MAPPING = {
  "2026-04-21": { 1: "p1a" },
  "2026-04-22": { 1: "p2a" },
  "2026-04-23": {
    1: "p3a", // Anogia
    2: "p3b", // Grotte de l'Ida
    3: "p3c", // Axos / route montagne
    4: "p3d", // Panormos
    5: "p3e", // Réthymnon vieux port
    6: "p4b", // arrivée La Canée tard, on la rattache au jour 4 (cohérence visuelle)
  },
  "2026-04-24": {
    1: "p4a", // Monastères Akrotiri
    2: "p4b", // La Canée vieux port
  },
  "2026-04-25": {
    1: "p5a", // Aptera
    2: "p5b", // Argyroupoli
    3: "p5c", // La Canée soir
  },
  "2026-04-26": {
    1: "p6a", // Balos area (Falasarna/Tigani)
    2: "p6a", // Balos area
    3: "p6a", // Balos lagoon
    4: "p6a", // Balos plage
    5: "p6b", // Kissamos
    6: "p6c", // route vers Topolia
    7: "p6c", // Topolia gorge
    8: "_day_6", // arrivée hotel sud
  },
  "2026-04-27": {
    1: "_day_7", // hotel matin
    2: "p7a", // Phaistos
    3: "p7b", // Agia Triada
    4: "p7c", // Matala
    5: "p7d", // Red Beach
  },
  "2026-04-28": {
    1: "_day_8", // hotel matin
    2: "p8a", // Kritsa
    3: "p8a", // Kritsa (Panagia Kera)
    4: "p8b", // Agios Nikolaos
    5: "p8c", // Mochlos
  },
  "2026-04-29": {
    1: "p9a", // Zakros
    2: "p9a", // Zakros palais
    3: "p9a", // Zakros baie
    4: "p9b", // Toplou
    5: "_day_9", // retour Mochlos
  },
  "2026-04-30": {
    1: "_day_10", // transit
    2: "p10a", // Plaka
    3: "p10a", // Spinalonga
    4: "p10a", // Plaka retour
    5: "p10b", // Plateau de Lasithi
    6: "p10c", // Héraklion départ
  },
};

const output = {};
let total = 0;
for (const dayEntry of clusters) {
  const dayMap = MAPPING[dayEntry.day];
  if (!dayMap) {
    console.warn(`No mapping for day ${dayEntry.day}, skipping`);
    continue;
  }
  for (const c of dayEntry.clusters) {
    const target = dayMap[c.idx];
    if (!target) {
      console.warn(`No mapping for ${dayEntry.day} cluster ${c.idx}, skipping`);
      continue;
    }
    output[target] = output[target] ?? [];
    for (const url of c.photos) {
      // We need the EXIF datetime + GPS of each photo. cluster.photos contains
      // only URLs. We'll re-read photos.json (the cluster script's source) to
      // get those, but we also have all photos in the cluster centroid info.
      // For simplicity here, store url + cluster centroid as the photo's
      // approximate lat/lng, and use cluster timeStart as a placeholder
      // datetime.
      // We'll improve this by reading the original EXIF data below.
      output[target].push({
        url,
        datetime: null, // will be filled by enrich step
        lat: null,
        lng: null,
      });
      total++;
    }
  }
}

// Enrich with real EXIF data by reading the all-photos extraction we did
// during clustering. Re-run a minimal EXIF parse here so each photo gets
// proper datetime + lat/lng (used by getPhotosForDay sorting).
import { readdir } from "fs/promises";
import { existsSync } from "fs";
import { extname } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const exifr = require("exifr");

const PHOTOS_DIR = [
  join(ROOT, "public", "photos"),
  join(ROOT, "photos"),
].find((d) => existsSync(d));

const exifByUrl = new Map();
if (PHOTOS_DIR) {
  const EXTENSIONS = new Set([".jpg", ".jpeg", ".heic", ".png"]);
  const files = (await readdir(PHOTOS_DIR))
    .filter((f) => EXTENSIONS.has(extname(f).toLowerCase()))
    .sort();

  console.log(`Reading EXIF from ${files.length} photos to enrich...`);

  for (const filename of files) {
    let exif = null;
    try {
      exif = await exifr.parse(join(PHOTOS_DIR, filename), {
        gps: true,
        exif: true,
      });
    } catch {}
    exifByUrl.set(`/photos/${filename}`, {
      datetime: exif?.DateTimeOriginal
        ? new Date(exif.DateTimeOriginal).toISOString()
        : null,
      lat: exif?.latitude ?? null,
      lng: exif?.longitude ?? null,
    });
  }
}

for (const key of Object.keys(output)) {
  output[key] = output[key]
    .map((entry) => ({
      ...entry,
      ...(exifByUrl.get(entry.url) ?? {}),
    }))
    .sort((a, b) => {
      if (!a.datetime) return 1;
      if (!b.datetime) return -1;
      return a.datetime.localeCompare(b.datetime);
    });
}

const OUTPUT_FILE = join(ROOT, "src", "data", "photos.json");
await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log(`\n✅ ${total} photos mappées`);
console.log(`→ ${OUTPUT_FILE}`);
console.log(`\nDistribution:`);
for (const [key, photos] of Object.entries(output).sort()) {
  console.log(`  ${key.padEnd(10)} ${photos.length}`);
}
