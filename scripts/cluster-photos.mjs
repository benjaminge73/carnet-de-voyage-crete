/**
 * Reads EXIF from every photo in photos/ (or public/photos/), groups them by
 * calendar day, then DBSCAN-clusters each day's GPS coordinates to discover
 * the actual places visited. Outputs:
 *   - scripts/clusters.json — raw cluster data (per-day clusters + photo URLs)
 *   - scripts/clusters-summary.txt — readable summary for hand review
 */

import { readdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, extname, resolve } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const exifr = require("exifr");

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const PHOTOS_DIR_CANDIDATES = [
  join(ROOT, "public", "photos"),
  join(ROOT, "photos"),
];
const PHOTOS_DIR = PHOTOS_DIR_CANDIDATES.find((d) => existsSync(d));
if (!PHOTOS_DIR) {
  console.error("No photos directory found. Tried:", PHOTOS_DIR_CANDIDATES);
  process.exit(1);
}

const EXTENSIONS = new Set([".jpg", ".jpeg", ".heic", ".png"]);

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Simple greedy clustering: walk photos in chronological order, start a new cluster
// when distance to current cluster centroid exceeds EPS_M. Tracks centroid as
// running mean. Re-merges clusters at the end if their centroids are within
// MERGE_EPS_M (catches the case where the user goes Place A → Place B → back to A).
const EPS_M = 800;       // start a new cluster if this far from the running centroid
const MERGE_EPS_M = 600; // post-merge clusters whose centroids are within this

function clusterDayPhotos(photos) {
  // photos already sorted by datetime
  const clusters = [];
  for (const p of photos) {
    if (clusters.length === 0) {
      clusters.push({ photos: [p], cLat: p.lat, cLng: p.lng });
      continue;
    }
    const cur = clusters[clusters.length - 1];
    const d = haversine(p.lat, p.lng, cur.cLat, cur.cLng);
    if (d <= EPS_M) {
      cur.photos.push(p);
      // running mean
      const n = cur.photos.length;
      cur.cLat = cur.cLat + (p.lat - cur.cLat) / n;
      cur.cLng = cur.cLng + (p.lng - cur.cLng) / n;
    } else {
      clusters.push({ photos: [p], cLat: p.lat, cLng: p.lng });
    }
  }
  // post-merge close clusters by centroid (preserves chronological order via labels)
  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      if (!clusters[i] || !clusters[j]) continue;
      const d = haversine(clusters[i].cLat, clusters[i].cLng, clusters[j].cLat, clusters[j].cLng);
      if (d <= MERGE_EPS_M) {
        // merge j into i
        const merged = [...clusters[i].photos, ...clusters[j].photos].sort((a, b) =>
          (a.datetime ?? "").localeCompare(b.datetime ?? "")
        );
        const n = merged.length;
        let lat = 0, lng = 0;
        for (const p of merged) { lat += p.lat; lng += p.lng; }
        clusters[i] = { photos: merged, cLat: lat / n, cLng: lng / n };
        clusters[j] = null;
      }
    }
  }
  return clusters.filter(Boolean);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const files = (await readdir(PHOTOS_DIR))
  .filter((f) => EXTENSIONS.has(extname(f).toLowerCase()))
  .sort();

console.log(`📷 Reading EXIF from ${files.length} photos in ${PHOTOS_DIR}...`);

const all = [];
for (const filename of files) {
  const filePath = join(PHOTOS_DIR, filename);
  let exif = null;
  try {
    exif = await exifr.parse(filePath, { gps: true, exif: true });
  } catch {}
  all.push({
    url: `/photos/${filename}`,
    filename,
    datetime: exif?.DateTimeOriginal ? new Date(exif.DateTimeOriginal).toISOString() : null,
    lat: exif?.latitude ?? null,
    lng: exif?.longitude ?? null,
  });
}

const withGps = all.filter((p) => p.lat !== null && p.lng !== null && p.datetime);
const noGps = all.filter((p) => p.lat === null || p.lng === null);
const noTime = all.filter((p) => !p.datetime);

console.log(`✅ ${withGps.length} avec GPS+date · ❌ ${noGps.length} sans GPS · ⏰ ${noTime.length} sans date`);

// Group by date (YYYY-MM-DD in local TZ from datetime)
const byDay = new Map();
for (const p of withGps) {
  const d = new Date(p.datetime);
  const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  if (!byDay.has(key)) byDay.set(key, []);
  byDay.get(key).push(p);
}

const sortedDays = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
console.log(`\n📅 ${sortedDays.length} jours distincts:`);

const dayClusters = [];
let summary = "";
for (const [day, photos] of sortedDays) {
  photos.sort((a, b) => a.datetime.localeCompare(b.datetime));
  const clusters = clusterDayPhotos(photos);
  console.log(`  ${day}: ${photos.length} photos → ${clusters.length} clusters`);
  summary += `\n=== ${day} (${photos.length} photos, ${clusters.length} clusters) ===\n`;
  const dayClusterEntries = [];
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    const firstTime = c.photos[0].datetime.slice(11, 16);
    const lastTime = c.photos[c.photos.length - 1].datetime.slice(11, 16);
    const line = `  [${i + 1}] ${c.photos.length} photos · ${firstTime}–${lastTime} · centroïde ${c.cLat.toFixed(4)}, ${c.cLng.toFixed(4)} · https://www.google.com/maps?q=${c.cLat.toFixed(5)},${c.cLng.toFixed(5)}`;
    summary += line + "\n";
    dayClusterEntries.push({
      idx: i + 1,
      count: c.photos.length,
      timeStart: firstTime,
      timeEnd: lastTime,
      lat: +c.cLat.toFixed(6),
      lng: +c.cLng.toFixed(6),
      photos: c.photos.map((p) => p.url),
    });
  }
  dayClusters.push({ day, totalPhotos: photos.length, clusters: dayClusterEntries });
}

await writeFile(join(__dirname, "clusters.json"), JSON.stringify(dayClusters, null, 2));
await writeFile(join(__dirname, "clusters-summary.txt"), summary);
console.log(`\n→ ${join(__dirname, "clusters.json")}`);
console.log(`→ ${join(__dirname, "clusters-summary.txt")}`);
console.log(`\nUnmatched (no GPS or no datetime):`);
for (const p of noGps) console.log(`  ${p.filename} ${p.datetime ?? "(no date)"}`);
