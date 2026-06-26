#!/usr/bin/env node
// Merges family-tags.json (produced by scripts/face-review/index.html) into
// src/data/photos.json. Idempotent. Photos not mentioned in the tag file are
// left untouched.
//
// Usage:
//   node scripts/apply-family-tags.mjs <family-tags.json>
//   node scripts/apply-family-tags.mjs <family-tags.json> --dry-run

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PHOTOS_JSON = resolve(__dirname, "../src/data/photos.json");

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const inputPath = args.find((a) => !a.startsWith("--"));
  if (!inputPath) {
    console.error("Usage: node scripts/apply-family-tags.mjs <family-tags.json> [--dry-run]");
    process.exit(1);
  }
  return { inputPath: resolve(process.cwd(), inputPath), dryRun };
}

export function applyTags(photos, tags) {
  // photos: Record<string, PhotoEntry[]>
  // tags: Record<string, { family: boolean, faceRatio?: number }>
  // Returns the new photos object and a small summary { updated, added, removed, unknown }.
  const out = {};
  const seenTagUrls = new Set();
  let updated = 0;
  let added = 0;
  let removed = 0;
  for (const [key, entries] of Object.entries(photos)) {
    if (!Array.isArray(entries)) {
      out[key] = entries;
      continue;
    }
    out[key] = entries.map((entry) => {
      if (!entry || typeof entry.url !== "string") return entry;
      const tag = tags[entry.url];
      if (!tag) return entry;
      seenTagUrls.add(entry.url);
      const wasFamily = entry.family === true;
      if (tag.family === true) {
        if (!wasFamily) {
          added += 1;
          updated += 1;
        }
        return { ...entry, family: true };
      }
      // tag.family === false: drop the field (we never write family: false).
      if (wasFamily) {
        removed += 1;
        updated += 1;
        const { family: _drop, ...rest } = entry;
        return rest;
      }
      return entry;
    });
  }
  const unknown = Object.keys(tags).filter((u) => !seenTagUrls.has(u));
  return { photos: out, summary: { updated, added, removed, unknown } };
}

async function main() {
  const { inputPath, dryRun } = parseArgs();
  const [photosRaw, tagsRaw] = await Promise.all([
    readFile(PHOTOS_JSON, "utf8"),
    readFile(inputPath, "utf8"),
  ]);
  const photos = JSON.parse(photosRaw);
  const tags = JSON.parse(tagsRaw);

  const { photos: nextPhotos, summary } = applyTags(photos, tags);

  console.log(`Applying ${Object.keys(tags).length} tags from ${inputPath}`);
  console.log(`  family added:   ${summary.added}`);
  console.log(`  family removed: ${summary.removed}`);
  if (summary.unknown.length > 0) {
    console.log(`  ${summary.unknown.length} tagged URLs not found in photos.json:`);
    for (const u of summary.unknown.slice(0, 10)) console.log(`    - ${u}`);
    if (summary.unknown.length > 10) console.log(`    … and ${summary.unknown.length - 10} more`);
  }

  if (dryRun) {
    console.log("--dry-run: not writing photos.json");
    return;
  }

  // Preserve trailing newline of original file.
  const trailingNewline = photosRaw.endsWith("\n") ? "\n" : "";
  await writeFile(PHOTOS_JSON, JSON.stringify(nextPhotos, null, 2) + trailingNewline);
  console.log(`✓ Wrote ${PHOTOS_JSON}`);
}

// Run as CLI when invoked directly, but stay importable for tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
