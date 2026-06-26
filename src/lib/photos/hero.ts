import { TRIP } from "@/data/trip";
import type { PhotoEntry } from "./types";
import { getPhotosForPlace, getPhotosForDay } from "./selector";

function getDayIdForPlace(placeId: string): number | null {
  for (const d of TRIP.days) {
    if (d.places.some((p) => p.id === placeId)) return d.id;
  }
  return null;
}

// Hero photo for a place: real photo if available, else the Nth photo from the day
// (rotated by place index so different places of the same day get different heroes),
// else null.
export function getHeroPhotoForPlace(placeId: string): PhotoEntry | null {
  const direct = getPhotosForPlace(placeId);
  const hero = direct.find((p) => p.kind !== "video") ?? direct[0] ?? null;
  if (hero) return hero;

  const dayId = getDayIdForPlace(placeId);
  if (!dayId) return null;
  const day = TRIP.days.find((d) => d.id === dayId);
  if (!day) return null;

  const dayPhotos = getPhotosForDay(dayId).filter((p) => p.kind !== "video");
  if (dayPhotos.length === 0) return null;

  const placeIndex = day.places.findIndex((p) => p.id === placeId);
  return dayPhotos[placeIndex % dayPhotos.length] ?? dayPhotos[0];
}
