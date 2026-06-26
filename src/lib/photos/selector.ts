import photosData from "@/data/photos.json";
import { TRIP } from "@/data/trip";
import type { PhotoEntry } from "./types";
import { getSiteVariant } from "./types";
import { resolveUrl } from "./url";

const data = photosData as Record<string, PhotoEntry[]>;

// Drops family photos when the current build is the portfolio variant.
// Called inside every public selector so there is no way to bypass it
// (no caller should access `data` directly).
function applyVariantFilter(entries: PhotoEntry[]): PhotoEntry[] {
  if (getSiteVariant() !== "portfolio") return entries;
  return entries.filter((e) => !e.family);
}

function medianDatetime(entries: PhotoEntry[]): string | null {
  const dts = entries.map((e) => e.datetime).filter((x): x is string => Boolean(x)).sort();
  if (dts.length === 0) return null;
  return dts[Math.floor(dts.length / 2)];
}

// Fill missing datetime with the median of other photos for the same placeId,
// so photos relocated manually keep a consistent order with the rest of the place.
export function fillMissingDatetime(entries: PhotoEntry[]): PhotoEntry[] {
  const fallback = medianDatetime(entries);
  if (!fallback) return entries;
  return entries.map((e) => (e.datetime ? e : { ...e, datetime: fallback }));
}

export function getPhotosForPlace(placeId: string): PhotoEntry[] {
  const raw = applyVariantFilter(data[placeId] ?? []);
  return fillMissingDatetime(raw).map(resolveUrl);
}

export function getPhotosForDay(dayId: number): PhotoEntry[] {
  const day = TRIP.days.find((d) => d.id === dayId);
  if (!day) return [];
  const byPlace = day.places.flatMap((p) => getPhotosForPlace(p.id));
  const dayLevel = applyVariantFilter(data[`_day_${dayId}`] ?? []).map(resolveUrl);
  return [...byPlace, ...dayLevel].sort((a, b) => {
    if (!a.datetime) return 1;
    if (!b.datetime) return -1;
    return a.datetime.localeCompare(b.datetime);
  });
}

export function getPhotoCount(placeId: string): number {
  const photos = getPhotosForPlace(placeId);
  if (photos.length > 0) return photos.length;
  return TRIP.days.flatMap((d) => d.places).find((p) => p.id === placeId)?.mediaCount ?? 0;
}

export function getMediaCountsForDay(dayId: number): { photos: number; videos: number } {
  const all = getPhotosForDay(dayId);
  let photos = 0;
  let videos = 0;
  for (const m of all) {
    if (m.kind === "video") videos++;
    else photos++;
  }
  return { photos, videos };
}

export function getTotalPhotoCount(): number {
  return TRIP.days
    .flatMap((d) => d.places)
    .reduce((sum, p) => sum + getPhotoCount(p.id), 0);
}
