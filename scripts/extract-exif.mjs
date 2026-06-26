/**
 * Reads EXIF from photos/ (all subdirectories), matches each file to the
 * correct day (by DateTimeOriginal) and place (by GPS proximity), and writes
 * src/data/photos.json.
 *
 * Supports:
 *  - Recursive subdir scanning (traveler-1/, traveler-2/, traveler-5/, traveler-4/, traveler-3/, Vidéos/)
 *  - Filename-based datetime fallback (WhatsApp, Android, PHOTO- formats)
 *  - GPS cross-reference: photos without GPS borrow coordinates from the
 *    nearest (in time) photo that has GPS (within 60 min)
 *  - iPhone video sequence matching: IMG_N.MOV borrows GPS from IMG_{N±1}.jpeg
 *  - Out-of-range photos with GPS: matched by coordinates only, day inferred
 *  - Videos stored with kind:"video" and .mp4 extension in URL
 *
 * Usage: npm run extract-photos
 */

import { readdir, writeFile } from "fs/promises";
import { join, extname, resolve, basename } from "path";
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
const PHOTOS_DIR = PHOTOS_DIR_CANDIDATES.find((d) => {
  try { require("fs").statSync(d); return true; } catch { return false; }
});
if (!PHOTOS_DIR) {
  console.error("No photos directory. Tried:", PHOTOS_DIR_CANDIDATES);
  process.exit(1);
}
const OUTPUT_FILE = join(ROOT, "src", "data", "photos.json");

// ─── Trip data ────────────────────────────────────────────────────────────────

const FR_MONTHS = {
  jan: 0, fév: 1, fev: 1, mars: 2, avr: 3, mai: 4,
  juin: 5, juil: 6, août: 7, aout: 7, sep: 8, oct: 9, nov: 10, déc: 11, dec: 11,
};
const TRIP_YEAR = 2026;

const DAYS = [
  { id: 1, date: "21 avr", places: [
    { id: "p1a", lat: 35.3398, lng: 25.1346 },
  ]},
  { id: 2, date: "22 avr", places: [
    { id: "p2a", lat: 35.3406, lng: 25.1367 },
  ]},
  { id: 3, date: "23 avr", places: [
    { id: "p3a", lat: 35.2518, lng: 24.8919 },
    { id: "p3b", lat: 35.2073, lng: 24.8315 },
    { id: "p3c", lat: 35.3109, lng: 24.8454 },
    { id: "p3d", lat: 35.4181, lng: 24.6664 },
    { id: "p3e", lat: 35.3699, lng: 24.4747 },
  ]},
  { id: 4, date: "24 avr", places: [
    { id: "p4a", lat: 35.5606, lng: 24.1353 },
    { id: "p4b", lat: 35.5173, lng: 24.0185 },
  ]},
  { id: 5, date: "25 avr", places: [
    { id: "p5a", lat: 35.4624, lng: 24.1413 },
    { id: "p5b", lat: 35.2864, lng: 24.3348 },
    { id: "p5c", lat: 35.5160, lng: 24.0175 },
  ]},
  { id: 6, date: "26 avr", places: [
    { id: "p6a", lat: 35.5859, lng: 23.5956 },
    { id: "p6b", lat: 35.5133, lng: 23.6084 },
    { id: "p6c", lat: 35.4868, lng: 23.7868 },
  ]},
  { id: 7, date: "27 avr", places: [
    { id: "p7a", lat: 35.0515, lng: 24.8140 },
    { id: "p7b", lat: 35.0336, lng: 24.7904 },
    { id: "p7c", lat: 34.9939, lng: 24.7491 },
    { id: "p7d", lat: 34.9737, lng: 24.7999 },
  ]},
  { id: 8, date: "28 avr", places: [
    { id: "p8a", lat: 35.1674, lng: 25.6446 },
    { id: "p8b", lat: 35.1897, lng: 25.7193 },
    { id: "p8c", lat: 35.1849, lng: 25.9050 },
  ]},
  { id: 9, date: "29 avr", places: [
    { id: "p9a", lat: 35.1032, lng: 26.2385 },
    { id: "p9b", lat: 35.2215, lng: 26.2162 },
  ]},
  { id: 10, date: "30 avr", places: [
    { id: "p10a", lat: 35.2980, lng: 25.7377 },
    { id: "p10b", lat: 35.2244, lng: 25.4614 },
    { id: "p10c", lat: 35.3383, lng: 25.1724 },
  ]},
];

// All places flat — for GPS-only matching of out-of-range photos
const ALL_PLACES = DAYS.flatMap((d) =>
  d.places.map((p) => ({ ...p, dayId: d.id }))
);

const PLACE_THRESHOLD_M = 800;
// Max time gap to borrow GPS from a neighbour photo (ms)
const GPS_BORROW_MS = 60 * 60 * 1000; // 60 min

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDayDate(frDate) {
  const [day, monthKey] = frDate.toLowerCase().split(" ");
  const month = FR_MONTHS[monthKey];
  if (month === undefined) throw new Error(`Unknown month: ${monthKey}`);
  return new Date(TRIP_YEAR, month, parseInt(day));
}

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

// Find nearest place (across all days) by GPS. Returns { place, dayId, dist }.
function findNearestPlace(lat, lng, dayPlaces = ALL_PLACES) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const p of dayPlaces) {
    const dist = haversine(lat, lng, p.lat, p.lng);
    if (dist < nearestDist) { nearestDist = dist; nearest = p; }
  }
  return nearest ? { place: nearest, dayId: nearest.dayId, dist: nearestDist } : null;
}

// Parse datetime from filename for formats that strip EXIF.
function parseDatetimeFromFilename(filename) {
  let m;

  // WhatsApp: "WhatsApp Image 2026-04-28 at 10.15.51.jpeg"
  m = filename.match(/WhatsApp Image (\d{4})-(\d{2})-(\d{2}) at (\d{2})\.(\d{2})\.(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);

  // Android: "20260427_171639.jpg"
  m = filename.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);

  // PHOTO: "PHOTO-2026-05-03-12-00-46.jpg"
  m = filename.match(/^PHOTO-(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);

  return null;
}

// Extract iPhone sequence number from "IMG_6829.MOV" or "IMG_6829 2.MOV" → 6829
function extractImgSeqNum(filename) {
  const m = filename.match(/^IMG_(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

// ─── Phase 1: Scan all subdirectories ─────────────────────────────────────────

const PHOTO_EXT = new Set([".jpg", ".jpeg", ".heic", ".png"]);
// Only scan .mov for videos — compressed .mp4 siblings are the target URLs,
// scanning both would create duplicate entries in photos.json.
const VIDEO_EXT = new Set([".mov"]);
const ALL_EXT = new Set([...PHOTO_EXT, ...VIDEO_EXT]);

async function scanDir(dir, relBase = "") {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...await scanDir(fullPath, relPath));
    } else {
      const ext = extname(entry.name).toLowerCase();
      if (ALL_EXT.has(ext)) {
        results.push({
          filename: entry.name,
          filepath: fullPath,
          subdir: relBase,
          ext,
        });
      }
    }
  }
  return results;
}

const allFiles = await scanDir(PHOTOS_DIR);
allFiles.sort((a, b) => a.filename.localeCompare(b.filename));
console.log(`\n📁  ${allFiles.length} fichiers trouvés (${allFiles.filter(f => VIDEO_EXT.has(f.ext)).length} vidéos)\n`);

// ─── Phase 2: Parse EXIF / metadata for every file ────────────────────────────

// parsed[i] = {
//   filename, subdir, filepath, url,
//   datetime: Date|null, datetimeMs: number|null,
//   lat: number|null, lng: number|null,
//   isVideo: bool, gpsSource: "exif"|"inferred"|null
// }
const parsed = [];

for (const file of allFiles) {
  const isVideo = VIDEO_EXT.has(file.ext);

  let exif = null;
  try {
    exif = await exifr.parse(file.filepath, { gps: true, exif: true });
  } catch { /* ignore */ }

  let datetime = exif?.DateTimeOriginal ?? null;
  let lat = exif?.latitude ?? null;
  let lng = exif?.longitude ?? null;

  // Filename fallback for datetime (WhatsApp strips EXIF)
  if (!datetime) {
    datetime = parseDatetimeFromFilename(file.filename);
  }

  // URL: /photos/{subdir}/{filename} — keeps subdir in path for local dev
  // Videos: swap .MOV → .mp4 (will be compressed by compress-videos.mjs)
  let urlFilename = file.filename;
  if (isVideo && file.ext === ".mov") {
    urlFilename = file.filename.replace(/\.MOV$/i, ".mp4");
  }
  const url = file.subdir
    ? `/photos/${file.subdir}/${urlFilename}`
    : `/photos/${urlFilename}`;

  parsed.push({
    filename: file.filename,
    subdir: file.subdir,
    filepath: file.filepath,
    url,
    datetime,
    datetimeMs: datetime ? datetime.getTime() : null,
    lat,
    lng,
    isVideo,
    gpsSource: lat !== null ? "exif" : null,
  });
}

// ─── Phase 3: GPS cross-reference ─────────────────────────────────────────────

// Build sorted list of entries that have GPS
const gpsEntries = parsed
  .filter((e) => e.lat !== null && e.datetimeMs !== null)
  .sort((a, b) => a.datetimeMs - b.datetimeMs);

// Build filename → entry map for sequence-number lookup
const filenameMap = new Map(parsed.map((e) => [e.filename.toLowerCase(), e]));

for (const entry of parsed) {
  if (entry.lat !== null) continue; // already has GPS
  if (entry.datetimeMs === null && !entry.isVideo) continue; // no datetime and not a video

  // Strategy 1 — iPhone sequence matching for videos (IMG_N.MOV → IMG_{N±1}.jpeg)
  if (entry.isVideo) {
    const seq = extractImgSeqNum(entry.filename);
    if (seq !== null) {
      // Look for adjacent photos — expand range so gaps (like IMG_6972→6975) are covered
      let donor = null;
      for (const delta of [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5]) {
        const candidate = filenameMap.get(`img_${seq + delta}.jpeg`) ??
                          filenameMap.get(`img_${seq + delta}.jpg`);
        if (candidate != null && candidate.lat !== null) { donor = candidate; break; }
      }
      if (donor) {
        entry.lat = donor.lat;
        entry.lng = donor.lng;
        entry.gpsSource = "inferred";
        // Borrow datetime too if missing
        if (!entry.datetime && donor.datetime) {
          entry.datetime = donor.datetime;
          entry.datetimeMs = donor.datetimeMs;
        }
        continue;
      }
    }
  }

  // Strategy 2 — nearest geolocated photo within 60 min
  if (entry.datetimeMs === null) continue;
  let bestDelta = Infinity;
  let bestDonor = null;
  for (const gpsEntry of gpsEntries) {
    const delta = Math.abs(gpsEntry.datetimeMs - entry.datetimeMs);
    if (delta < bestDelta) { bestDelta = delta; bestDonor = gpsEntry; }
    if (gpsEntry.datetimeMs > entry.datetimeMs + GPS_BORROW_MS) break;
  }
  if (bestDonor && bestDelta <= GPS_BORROW_MS) {
    entry.lat = bestDonor.lat;
    entry.lng = bestDonor.lng;
    entry.gpsSource = "inferred";
  }
}

// ─── Phase 4: Match entries to days and places ────────────────────────────────

const dayDates = DAYS.map((d) => ({ ...d, jsDate: parseDayDate(d.date) }));

function sameDate(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const output = {};
let countPlace = 0;
let countDay = 0;
let countUnmatched = 0;

for (const entry of parsed) {
  const baseEntry = {
    url: entry.url,
    datetime: entry.datetime ? entry.datetime.toISOString() : null,
    lat: entry.lat,
    lng: entry.lng,
    ...(entry.isVideo ? { kind: "video" } : {}),
  };

  if (!entry.datetime) {
    // No datetime at all — truly unmatched
    output._unmatched = output._unmatched ?? [];
    output._unmatched.push({
      ...baseEntry,
      reason: "pas de datetime (EXIF ni nom de fichier)",
    });
    countUnmatched++;
    continue;
  }

  // Try to find a matching trip day
  const matchedDay = dayDates.find((d) => sameDate(entry.datetime, d.jsDate));

  if (matchedDay) {
    // Within trip range — standard flow
    if (entry.lat !== null && entry.lng !== null) {
      const dayPlaces = matchedDay.places.map((p) => ({ ...p, dayId: matchedDay.id }));
      const result = findNearestPlace(entry.lat, entry.lng, dayPlaces);
      if (result && result.dist <= PLACE_THRESHOLD_M) {
        output[result.place.id] = output[result.place.id] ?? [];
        output[result.place.id].push(baseEntry);
        countPlace++;
        continue;
      }
    }
    // Day-level bucket
    const dayKey = `_day_${matchedDay.id}`;
    output[dayKey] = output[dayKey] ?? [];
    output[dayKey].push(baseEntry);
    countDay++;
    continue;
  }

  // Outside trip date range — try GPS-only matching across all places
  if (entry.lat !== null && entry.lng !== null) {
    const result = findNearestPlace(entry.lat, entry.lng, ALL_PLACES);
    if (result && result.dist <= PLACE_THRESHOLD_M) {
      output[result.place.id] = output[result.place.id] ?? [];
      output[result.place.id].push(baseEntry);
      countPlace++;
      continue;
    }
  }

  // Could not match
  output._unmatched = output._unmatched ?? [];
  const reason = entry.lat !== null
    ? `hors plage voyage (${entry.datetime.toLocaleDateString("fr-FR")}) + aucun lieu à < ${PLACE_THRESHOLD_M}m`
    : `hors plage voyage (${entry.datetime.toLocaleDateString("fr-FR")}) + pas de GPS`;
  output._unmatched.push({ ...baseEntry, reason });
  countUnmatched++;
}

// ─── Manual overrides (photos that can't be auto-matched) ────────────────────
// Format: { url, placeId, lat, lng }
// url must match the generated /photos/{subdir}/{filename} path.
const MANUAL_OVERRIDES = [
  // traveler-4 — Balos (p6a) — 03/05/2026 12:00-12:01
  ...[
    "PHOTO-2026-05-03-12-00-46.jpg", "PHOTO-2026-05-03-12-00-47.jpg",
    "PHOTO-2026-05-03-12-00-51.jpg", "PHOTO-2026-05-03-12-00-54.jpg",
    "PHOTO-2026-05-03-12-00-55.jpg", "PHOTO-2026-05-03-12-00-56.jpg",
    "PHOTO-2026-05-03-12-01-02.jpg", "PHOTO-2026-05-03-12-01-03-2.jpg",
    "PHOTO-2026-05-03-12-01-03.jpg", "PHOTO-2026-05-03-12-01-04-2.jpg",
    "PHOTO-2026-05-03-12-01-04-3.jpg", "PHOTO-2026-05-03-12-01-04.jpg",
    "PHOTO-2026-05-03-12-01-06.jpg", "PHOTO-2026-05-03-12-01-07.jpg",
    "PHOTO-2026-05-03-12-01-08-2.jpg", "PHOTO-2026-05-03-12-01-08.jpg",
  ].map(f => ({ url: `/photos/traveler-4/${f}`, placeId: "p6a", lat: 35.5859, lng: 23.5956 })),
  // traveler-4 — Gorge de Topolia (p6c) — 03/05/2026 12:01
  ...[
    "PHOTO-2026-05-03-12-01-09-2.jpg", "PHOTO-2026-05-03-12-01-09-3.jpg",
    "PHOTO-2026-05-03-12-01-09.jpg", "PHOTO-2026-05-03-12-01-10-2.jpg",
    "PHOTO-2026-05-03-12-01-10-3.jpg", "PHOTO-2026-05-03-12-01-10.jpg",
  ].map(f => ({ url: `/photos/traveler-4/${f}`, placeId: "p6c", lat: 35.4868, lng: 23.7868 })),
];

for (const override of MANUAL_OVERRIDES) {
  // Remove from _unmatched if present
  if (output._unmatched) {
    output._unmatched = output._unmatched.filter(e => e.url !== override.url);
  }
  // Find the parsed entry to get its datetime
  const parsed_entry = parsed.find(e => e.url === override.url);
  const datetime = parsed_entry?.datetime ? parsed_entry.datetime.toISOString() : null;
  output[override.placeId] = output[override.placeId] ?? [];
  // Avoid duplicates
  if (!output[override.placeId].some(e => e.url === override.url)) {
    output[override.placeId].push({ url: override.url, datetime, lat: override.lat, lng: override.lng });
    countPlace++;
    if (output._unmatched) countUnmatched--;
  }
}
if (output._unmatched && output._unmatched.length === 0) delete output._unmatched;

// ─── Sort entries within each bucket by datetime ───────────────────────────────

for (const key of Object.keys(output)) {
  if (key === "_unmatched") continue; // keep for readability
  output[key].sort((a, b) => {
    if (!a.datetime) return 1;
    if (!b.datetime) return -1;
    return a.datetime.localeCompare(b.datetime);
  });
}

await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));

// ─── Report ───────────────────────────────────────────────────────────────────

console.log(`✅  ${countPlace} fichiers assignés à un lieu`);
console.log(`📅  ${countDay} fichiers assignés à un jour (GPS hors seuil ou absent)`);
console.log(`❓  ${countUnmatched} fichiers non matchés`);
console.log(`\n→  ${OUTPUT_FILE}\n`);

if (countUnmatched > 0) {
  console.log("══════════════════════════════════════════════════════");
  console.log("📋  FICHIERS NON LOCALISÉS — à assigner manuellement :");
  console.log("══════════════════════════════════════════════════════\n");
  for (const e of (output._unmatched ?? [])) {
    const name = e.url.split("/").pop();
    const dt = e.datetime
      ? new Date(e.datetime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
      : "pas de date";
    console.log(`  • ${name}`);
    console.log(`    Date  : ${dt}`);
    console.log(`    Raison: ${e.reason}`);
    console.log();
  }
}
