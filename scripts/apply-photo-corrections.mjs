#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PHOTOS_PATH = path.join(process.cwd(), "src/data/photos.json");
const d = JSON.parse(fs.readFileSync(PHOTOS_PATH, "utf-8"));

const findByName = (name) => {
  for (const k of Object.keys(d)) {
    const i = d[k].findIndex((e) => e.url.endsWith("/" + name) || e.url.endsWith(name));
    if (i !== -1) return { key: k, idx: i, entry: d[k][i] };
  }
  return null;
};

const remove = (name) => {
  const f = findByName(name);
  if (!f) return null;
  const [e] = d[f.key].splice(f.idx, 1);
  return e;
};

const move = (name, toKey) => {
  const e = remove(name);
  if (!e) {
    console.warn(`  ! not found: ${name}`);
    return;
  }
  d[toKey] ??= [];
  d[toKey].push(e);
};

// 1) Dedup video chats (J1)
console.log("1) Dedup IMG_6829 2.mp4");
remove("IMG_6829 2.mp4");

// 2) J3: drop p3d (Panormos), move its photo to p3e
console.log("2) Move p3d photo to p3e (Réthymnon)");
for (const e of d.p3d ?? []) {
  d.p3e ??= [];
  d.p3e.push(e);
}
delete d.p3d;

// 3) J5: move IMG_7003.mp4 from p5c to _day_6
console.log("3) Move IMG_7003.mp4 to _day_6 (route vers Balos)");
move("IMG_7003.mp4", "_day_6");

// 4) J6 restructure:
//    Current p6c contains: IMG_7038, IMG_7039 (olivier per user "2 premières")
//                          5 traveler-4 PHOTO-2026-05-03-... (fabrique)
//    New layout: p6c = Biolea fabrique, p6d = Olivier de Vouves (per plan, user wants Biolea before Olivier)
console.log("4) Split J6 p6c into Biolea (p6c) + Olivier Vouves (p6d)");
const oldP6c = d.p6c || [];
// Sort chronologically to identify "2 premières"
const sorted = oldP6c.slice().sort((a, b) => (a.datetime || "").localeCompare(b.datetime || ""));
const olivierPhotos = sorted.slice(0, 2); // IMG_7038, IMG_7039
const fabriquePhotos = sorted.slice(2);    // traveler-4's photos
d.p6c = fabriquePhotos; // Biolea
d.p6d = olivierPhotos;  // Olivier Vouves
console.log(`   p6c (Biolea): ${d.p6c.length} photos`);
console.log(`   p6d (Olivier Vouves): ${d.p6d.length} photos`);

// 5) J7: create p7a (Villa infinite vue) cluster, renumber existing places
//    Villa GPS ≈ 35.0778, 24.8778
//    Cluster: IMG_7041 (in _day_6), IMG_7042, IMG_7043, IMG_7045, 20260427_190317, IMG_7095 (all in _day_7),
//             IMG_7097 (in _day_8)
console.log("5) Renumber J7 places and create p7a Villa");
const villaNames = [
  "IMG_7041.jpeg",
  "IMG_7042.jpeg",
  "IMG_7043.jpeg",
  "IMG_7045.jpeg",
  "20260427_190317.jpg",
  "IMG_7095.jpeg",
  "IMG_7097.jpeg",
];
const villaEntries = [];
for (const n of villaNames) {
  const e = remove(n);
  if (e) villaEntries.push(e);
  else console.warn(`   ! not found: ${n}`);
}

// Renumber existing J7 places: p7a -> p7b, p7b -> p7c, p7c -> p7d, p7d -> p7e
const oldP7a = d.p7a; // Phaistos
const oldP7b = d.p7b; // Agia Triada
const oldP7c = d.p7c; // Matala
const oldP7d = d.p7d; // Red Beach
delete d.p7a; delete d.p7b; delete d.p7c; delete d.p7d;
d.p7a = villaEntries;            // Villa infinite vue
d.p7b = oldP7a || [];            // Phaistos
d.p7c = oldP7b || [];            // Agia Triada
d.p7d = oldP7c || [];            // Matala
d.p7e = oldP7d || [];            // Odigitria (was Red Beach)

// 6) J8: park first 14 photos chronologically in _unassigned_day_8
console.log("6) Park first 14 J8 photos in _unassigned_day_8");
const j8Names = [
  "IMG_7097.jpeg",  // already moved to villa above
  "PHOTO-2026-04-28-10-03-41.jpg",
  "PHOTO-2026-04-28-10-03-42-2.jpg",
  "PHOTO-2026-04-28-10-03-42-3.jpg",
  "PHOTO-2026-04-28-10-03-42.jpg",
  "PHOTO-2026-04-28-10-03-43.jpg",
  "WhatsApp Image 2026-04-28 at 10.15.51.jpeg",
  "WhatsApp Image 2026-04-28 at 10.16.13.jpeg",
  "WhatsApp Image 2026-04-28 at 10.16.20.jpeg",
  "WhatsApp Image 2026-04-28 at 10.16.33.jpeg",
  "WhatsApp Image 2026-04-28 at 10.16.47.jpeg",
  "WhatsApp Image 2026-04-28 at 10.17.02.jpeg",
  "WhatsApp Image 2026-04-28 at 10.17.12.jpeg",
  "WhatsApp Image 2026-04-28 at 10.18.25.jpeg",
];
d._unassigned_day_8 ??= [];
for (const n of j8Names) {
  if (n === "IMG_7097.jpeg") continue; // already in villa
  const e = remove(n);
  if (e) d._unassigned_day_8.push(e);
  else console.warn(`   ! not found in J8: ${n}`);
}

// 7) J10 renumbering: new p10a (Olivier Kavoussi, no photos), shift others
//    Old: p10a Spinalonga, p10b Lasithi, p10c Héraklion départ
//    New: p10a Olivier Kavoussi (empty), p10b Spinalonga, p10c Kardiotissa (empty, replaces Lasithi), p10d Héraklion départ
console.log("7) Renumber J10 places");
const oldP10a = d.p10a;
const oldP10b = d.p10b;
const oldP10c = d.p10c;
delete d.p10a; delete d.p10b; delete d.p10c;
d.p10a = [];                  // Olivier Kavoussi (no photos yet — there's an "ancienne p10a Spinalonga first photo" pour kavoussi olivier ; à clarifier avec utilisateur après)
d.p10b = oldP10a || [];        // Spinalonga (was p10a)
d.p10c = [];                  // Kardiotissa (replaces Lasithi)
d.p10d = oldP10c || [];        // Héraklion départ (was p10c)
// oldP10b (Lasithi photos) — re-park in _day_10 (they may now be unattributed)
if (oldP10b && oldP10b.length > 0) {
  d._day_10 ??= [];
  for (const e of oldP10b) d._day_10.push(e);
  console.log(`   parked ${oldP10b.length} ex-Lasithi photos into _day_10`);
}

// Write back with stable key ordering
const orderedKeys = Object.keys(d).sort((a, b) => {
  // _unassigned_* last, _day_* before that, then by natural key
  const aU = a.startsWith("_unassigned_");
  const bU = b.startsWith("_unassigned_");
  if (aU !== bU) return aU ? 1 : -1;
  const aD = a.startsWith("_day_");
  const bD = b.startsWith("_day_");
  if (aD !== bD) return aD ? 1 : -1;
  return a.localeCompare(b, undefined, { numeric: true });
});
const out = {};
for (const k of orderedKeys) out[k] = d[k];
fs.writeFileSync(PHOTOS_PATH, JSON.stringify(out, null, 2) + "\n");
console.log("\nWrote", PHOTOS_PATH);
console.log("Keys:", Object.keys(out).join(" "));
