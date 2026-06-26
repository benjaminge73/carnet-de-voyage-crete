#!/usr/bin/env node
/**
 * Compress MOV videos to MP4 using ffmpeg.
 * Scans photos/ recursively for *.MOV files, outputs *.mp4 alongside.
 * Skips files that already have a corresponding .mp4.
 *
 * Requires: brew install ffmpeg
 * Usage:    node scripts/compress-videos.mjs
 */

import { readdir, stat } from "fs/promises";
import { join, extname, basename, resolve } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { spawn, execSync } from "child_process";

const require = createRequire(import.meta.url);
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

// Check ffmpeg availability
try {
  execSync("ffmpeg -version", { stdio: "ignore" });
} catch {
  console.error("❌  ffmpeg non trouvé. Installer avec: brew install ffmpeg");
  process.exit(1);
}

async function findMovFiles(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findMovFiles(fullPath));
    } else if (extname(entry.name).toLowerCase() === ".mov") {
      results.push(fullPath);
    }
  }
  return results;
}

function fmt(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function runFfmpeg(input, output) {
  return new Promise((resolve, reject) => {
    const args = [
      "-i", input,
      "-vcodec", "libx264",
      "-crf", "28",
      "-preset", "medium",
      "-vf", "scale='min(1280,iw)':-2",
      "-acodec", "aac",
      "-movflags", "+faststart",
      "-y",
      output,
    ];
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}:\n${stderr.slice(-800)}`));
    });
  });
}

const movFiles = await findMovFiles(PHOTOS_DIR);
console.log(`\n🎬  ${movFiles.length} fichiers MOV trouvés\n`);
if (movFiles.length === 0) process.exit(0);

let ok = 0;
let skip = 0;
let fail = 0;

for (const movPath of movFiles) {
  const mp4Path = movPath.replace(/\.MOV$/i, ".mp4");
  const name = basename(movPath);

  // Skip if already compressed
  try {
    await stat(mp4Path);
    console.log(`⏭  ${name} → déjà compressé, ignoré`);
    skip++;
    continue;
  } catch { /* not found */ }

  const beforeSize = (await stat(movPath)).size;
  process.stdout.write(`⏳  ${name} (${fmt(beforeSize)}) → compression...`);

  try {
    await runFfmpeg(movPath, mp4Path);
    const afterSize = (await stat(mp4Path)).size;
    const saved = Math.round((1 - afterSize / beforeSize) * 100);
    console.log(`\r✅  ${name}: ${fmt(beforeSize)} → ${fmt(afterSize)} (-${saved}%)        `);
    ok++;
  } catch (err) {
    console.error(`\r❌  ${name}: ${err.message}`);
    fail++;
  }
}

console.log(`\n─────────────────────────────────`);
console.log(`✅  ${ok} compressés`);
if (skip) console.log(`⏭  ${skip} ignorés (déjà existants)`);
if (fail) console.log(`❌  ${fail} échoués`);
console.log();
