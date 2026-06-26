#!/usr/bin/env node
/**
 * Generates poster images for every .mp4 in the photos/ dir,
 * then uploads them to R2 alongside the video as <name>.poster.webp.
 *
 * Requires: ffmpeg in PATH
 * Required env vars: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID
 *
 * Usage:
 *   node scripts/build-video-posters.mjs              # auto-detect photos/
 *   node scripts/build-video-posters.mjs <dossier>
 */

import { readdir, mkdtemp, rm } from "fs/promises";
import { join, extname, relative, basename, dirname } from "path";
import { tmpdir } from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { createReadStream } from "fs";
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const execFileAsync = promisify(execFile);

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

async function findVideos(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findVideos(fullPath)));
    } else if (/\.mp4$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const videos = await findVideos(PHOTOS_DIR);
console.log(`Found ${videos.length} MP4 files. Building posters…\n`);

const tmp = await mkdtemp(join(tmpdir(), "posters-"));
let ok = 0, skip = 0, fail = 0;

for (const videoPath of videos) {
  const key = relative(PHOTOS_DIR, videoPath).replace(/\\/g, "/");
  const posterKey = key.replace(/\.mp4$/i, ".poster.webp");

  // Check if poster already exists in R2
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: posterKey }));
    skip++;
    process.stdout.write(`\rskip ${posterKey}`);
    continue;
  } catch (e) {
    if (e.$metadata?.httpStatusCode !== 404) {
      console.error(`\nHEAD error ${posterKey}: ${e.message}`);
      fail++;
      continue;
    }
  }

  const posterFile = join(tmp, basename(posterKey));
  const pngTmp = posterFile.replace(/\.webp$/, ".png");

  // Extract first frame with ffmpeg (PNG), then encode webp with cwebp
  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", videoPath,
      "-vframes", "1",
      "-vf", "scale=1280:-2",
      pngTmp,
    ]);
    await execFileAsync("cwebp", ["-q", "80", pngTmp, "-o", posterFile]);
  } catch (e) {
    console.error(`\nencode error ${key}: ${e.message}`);
    fail++;
    continue;
  }

  try {
    const stream = createReadStream(posterFile);
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: posterKey,
        Body: stream,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    ok++;
    console.log(`✓ ${posterKey}`);
  } catch (e) {
    console.error(`\nUpload error ${posterKey}: ${e.message}`);
    fail++;
  }
}

await rm(tmp, { recursive: true, force: true });
console.log(`\nDone: ${ok} créés, ${skip} déjà existants, ${fail} échoués`);
