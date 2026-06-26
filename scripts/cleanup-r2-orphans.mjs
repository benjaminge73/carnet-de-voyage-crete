#!/usr/bin/env node
// Delete root-level orphan objects in R2 (keys with no "/" in them).
// Used to clean up the bad first upload where keys lacked subdir prefix.

import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID } = process.env;
if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID) {
  console.error("Missing R2_* env vars");
  process.exit(1);
}

const BUCKET = process.env.R2_BUCKET ?? "travel-photos";
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const DRY_RUN = process.argv.includes("--dry-run");

let continuationToken;
const orphans = [];
do {
  const res = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: continuationToken })
  );
  for (const obj of res.Contents ?? []) {
    if (obj.Key && !obj.Key.includes("/")) orphans.push(obj.Key);
  }
  continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
} while (continuationToken);

console.log(`Found ${orphans.length} orphan keys (no '/'):`);
for (const k of orphans.slice(0, 5)) console.log(`  ${k}`);
if (orphans.length > 5) console.log(`  ... (${orphans.length - 5} more)`);

if (DRY_RUN) {
  console.log("\nDry run — nothing deleted. Re-run without --dry-run to delete.");
  process.exit(0);
}

if (orphans.length === 0) process.exit(0);

for (let i = 0; i < orphans.length; i += 1000) {
  const batch = orphans.slice(i, i + 1000);
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: batch.map((Key) => ({ Key })) },
    })
  );
  console.log(`Deleted ${i + batch.length}/${orphans.length}`);
}
