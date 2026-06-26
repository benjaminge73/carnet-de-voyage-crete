// Public API for photo handling.
// Internally split into url (R2 + Cloudflare Image Resizing),
// selector (queries against photos.json + trip), and hero (cover fallback).
export type { PhotoEntry } from "./types";
export {
  PHOTOS_BASE,
  resolveUrl,
  cfImageUrl,
  snapWidth,
  thumbnailUrl,
} from "./url";
export {
  fillMissingDatetime,
  getPhotosForPlace,
  getPhotosForDay,
  getPhotoCount,
  getMediaCountsForDay,
  getTotalPhotoCount,
} from "./selector";
export { getHeroPhotoForPlace } from "./hero";
