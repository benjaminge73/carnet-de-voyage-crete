#!/usr/bin/env node
/**
 * Uploads photos and videos from photos/ to Cloudflare R2.
 * Preserves subdir structure: traveler-1/IMG_6830.jpeg, Vidéos/IMG_6829.mp4, etc.
 * Skips .MOV files (only uploads compressed .mp4).
 * Idempotent: HEAD check before PUT, skips if object already exists.
 *
 * Required env vars:
 *   R2_ACCESS_KEY_ID      — R2 S3-compatible access key
 *   R2_SECRET_ACCESS_KEY  — R2 S3-compatible secret key
 *   R2_ACCOUNT_ID         — Cloudflare account ID
 *
 * Usage:
 *   node scripts/upload-r2.mjs              # auto-detect photos/ or public/photos/
 *   node scripts/upload-r2.mjs <dossier>    # chemin relatif au projet
 */

import { readdir, readFile } from "fs/promises";
import { join, extname, relative } from "path";
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID } = process.env;
if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID) {
  console.error("Missing R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_ACCOUNT_ID env vars");
  process.exit(1);
}

const BUCKET = process.env.R2_BUCKET ?? "travel-photos";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const arg = process.argv[2];
const { existsSync } = await import("fs");
const PHOTOS_DIR = arg
  ? join(process.cwd(), arg)
  : existsSync(join(process.cwd(), "photos"))
    ? join(process.cwd(), "photos")
    : join(process.cwd(), "public", "photos");

const PHOTO_EXT = /\.(jpe?g|png|heic|webp)$/i;
const VIDEO_EXT = /\.mp4$/i;
const SKIP_EXT = /\.mov$/i;

async function scanDir(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await scanDir(fullPath)));
    } else if (!SKIP_EXT.test(entry.name)) {
      if (PHOTO_EXT.test(entry.name) || VIDEO_EXT.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const files = await scanDir(PHOTOS_DIR);

console.log(`Dossier : ${PHOTOS_DIR}`);
console.log(`Uploading ${files.length} fichiers vers R2 (${BUCKET})…\n`);

let ok = 0;
let skip = 0;
let fail = 0;

for (const filepath of files) {
  const key = relative(PHOTOS_DIR, filepath).replace(/\\/g, "/");
  const ext = extname(filepath).slice(1).toLowerCase();
  const mime =
    ext === "png" ? "image/png"
    : ext === "heic" ? "image/heic"
    : ext === "webp" ? "image/webp"
    : ext === "mp4" ? "video/mp4"
    : "image/jpeg";

  // HEAD check — skip if already exists
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    skip++;
    continue;
  } catch (e) {
    if (e.$metadata?.httpStatusCode !== 404) {
      console.error(`\nHEAD error ${key}: ${e.message}`);
      fail++;
      continue;
    }
  }

  const body = await readFile(filepath);

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: mime,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    ok++;
    process.stdout.write(`\r✓ ${ok + skip}/${files.length} — ${key.padEnd(50).slice(0, 50)}`);
  } catch (e) {
    console.error(`\nFAIL ${key}: ${e.message}`);
    fail++;
  }
}

console.log(`\n\nDone: ${ok} uploadés, ${skip} déjà existants, ${fail} échoués`);
