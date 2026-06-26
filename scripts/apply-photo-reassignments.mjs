#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATH = path.join(process.cwd(), "src/data/photos.json");
const d = JSON.parse(fs.readFileSync(PATH, "utf-8"));

const remove = (name) => {
  for (const k of Object.keys(d)) {
    const i = d[k].findIndex((e) => e.url.endsWith("/" + name));
    if (i !== -1) {
      const [e] = d[k].splice(i, 1);
      return { from: k, entry: e };
    }
  }
  return null;
};

const move = (name, toKey) => {
  const r = remove(name);
  if (!r) {
    console.warn("! not found:", name);
    return;
  }
  d[toKey] ??= [];
  d[toKey].push(r.entry);
  console.log(`  ${name}: ${r.from} → ${toKey}`);
};

const mappings = [
  ["PHOTO-2026-04-28-10-03-41.jpg", "p7c"],          // Agia Triada
  ["PHOTO-2026-04-28-10-03-42.jpg", "p4b"],          // La Canée
  ["PHOTO-2026-04-28-10-03-42-2.jpg", "p4b"],
  ["PHOTO-2026-04-28-10-03-42-3.jpg", "p4b"],
  ["PHOTO-2026-04-28-10-03-43.jpg", "p4b"],
  ["WhatsApp Image 2026-04-28 at 10.18.25.jpeg", "p7a"],  // Villa
  ["WhatsApp Image 2026-04-28 at 10.15.51.jpeg", "p4b"],
  ["WhatsApp Image 2026-04-28 at 10.16.13.jpeg", "p2a"],  // Héraklion J2
  ["WhatsApp Image 2026-04-28 at 10.16.20.jpeg", "p7a"],
  ["WhatsApp Image 2026-04-28 at 10.16.33.jpeg", "p6c"],  // Biolea
  ["WhatsApp Image 2026-04-28 at 10.16.47.jpeg", "p4b"],
  ["WhatsApp Image 2026-04-28 at 10.17.12.jpeg", "p4b"],
  ["WhatsApp Image 2026-04-28 at 10.17.02.jpeg", "p5a"],  // Aptera
];

console.log("Reassigning _unassigned_day_8 photos:");
for (const [name, to] of mappings) move(name, to);

console.log("\nMoving Kavoussi olivier photos to p10a:");
move("IMG_7185.jpeg", "p10a");
move("IMG_7187.jpeg", "p10a");

// Remove _unassigned_day_8 if empty
if (d._unassigned_day_8 && d._unassigned_day_8.length === 0) {
  delete d._unassigned_day_8;
  console.log("\nRemoved empty _unassigned_day_8");
}

// Stable sort keys
const orderedKeys = Object.keys(d).sort((a, b) => {
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
fs.writeFileSync(PATH, JSON.stringify(out, null, 2) + "\n");
console.log("\nKeys:", Object.keys(out).join(" "));
