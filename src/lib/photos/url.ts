import type { PhotoEntry } from "./types";

// In production, photos are served from an external object store (e.g.
// Cloudflare R2) behind a custom domain. Set NEXT_PUBLIC_PHOTOS_BASE_URL to
// that domain. Locally, public/photos serves the files at /photos/* and the
// placeholder host below is used.
export const PHOTOS_BASE =
  process.env.NEXT_PUBLIC_PHOTOS_BASE_URL ??
  "https://photos.example.com";

// Host of PHOTOS_BASE — used to gate the on-the-fly image-resizing rewrite so
// it follows whatever domain is configured above.
const PHOTOS_HOST = PHOTOS_BASE.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

export function resolveUrl(entry: PhotoEntry): PhotoEntry {
  if (!PHOTOS_BASE || !entry.url.startsWith("/photos/")) return entry;
  return { ...entry, url: PHOTOS_BASE + entry.url.slice("/photos".length) };
}

// Returns a resized image URL via Cloudflare Image Resizing.
// Format: /cdn-cgi/image/<params>/https://<host>/<key>
// Falls back to the original URL for sources on a different host.
export function cfImageUrl(
  url: string,
  opts: { width: number; height?: number; quality?: number; resize?: "cover" | "contain" },
): string {
  if (!PHOTOS_HOST || !url.includes(PHOTOS_HOST)) return url;

  const parts: string[] = [`width=${opts.width}`];
  if (opts.height) parts.push(`height=${opts.height}`);
  parts.push(`quality=${opts.quality ?? 70}`);
  parts.push("format=auto");
  if (opts.resize) parts.push(`fit=${opts.resize}`);

  return `https://${PHOTOS_HOST}/cdn-cgi/image/${parts.join(",")}/${url}`;
}

// Snap a target display width to a small set of canonical widths,
// so the browser cache hit rate stays high across pages and viewports.
const CANONICAL_WIDTHS = [200, 400, 800, 1200];
export function snapWidth(target: number): number {
  for (const w of CANONICAL_WIDTHS) if (w >= target) return w;
  return CANONICAL_WIDTHS[CANONICAL_WIDTHS.length - 1];
}

// Square thumbnail (cover-cropped). Used for map pins and small UI thumbs.
export function thumbnailUrl(url: string, size = 96): string {
  return cfImageUrl(url, { width: size, height: size, quality: 70, resize: "cover" });
}
