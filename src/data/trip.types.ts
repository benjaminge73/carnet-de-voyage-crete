export type PlaceKind = "monument" | "site" | "musée" | "ville" | "village" | "plage" | "nature";

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: PlaceKind;
  context: string;
  mediaCount: number;
}

export interface Day {
  id: number;
  date: string;
  weekday: string;
  stage: string;
  title: string;
  summary: string;
  km: number;
  places: Place[];
}

export interface Trip {
  title: string;
  subtitle: string;
  dates: string;
  travelers: number;
  totalPhotos: number;
  totalKm: number;
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  days: Day[];
}

// Day 2 is merged into day 1 for display: same arrival day, shared photos / hero.
// MERGED_INTO maps a parent day id to the child day ids it absorbs.
export const MERGED_INTO: Record<number, number[]> = { 1: [2] };

// Reverse lookup: child day id → parent day id.
export const MERGED_FROM: Record<number, number> = Object.entries(MERGED_INTO).reduce(
  (acc, [parent, children]) => {
    for (const child of children) acc[child] = Number(parent);
    return acc;
  },
  {} as Record<number, number>,
);

// Set of every day id that is merged into a parent (i.e. should be hidden from listings).
export const MERGED_CHILD_IDS: Set<number> = new Set(Object.values(MERGED_INTO).flat());

// Returns the given day id plus the ids of any days merged into it (ordered: self first).
export function mergedDayIdsFor(dayId: number): number[] {
  return [dayId, ...(MERGED_INTO[dayId] ?? [])];
}

export const DAY_TONES: [string, string][] = [
  ["#E8B79A", "#C8553D"],
  ["#D4A574", "#8B6F47"],
  ["#A8D0E6", "#2E5E7E"],
  ["#C9B89B", "#7A6A4F"],
  ["#F0D5C0", "#C8553D"],
  ["#7FC8D9", "#2E5E7E"],
  ["#9CAE8E", "#5A6B4E"],
  ["#B8A8C4", "#5E4E70"],
  ["#E0C896", "#A88445"],
  ["#D4A574", "#C8553D"],
];

export const KIND_LABEL: Record<PlaceKind, string> = {
  monument: "Monument",
  site: "Site",
  musée: "Musée",
  ville: "Ville",
  village: "Village",
  plage: "Plage",
  nature: "Nature",
};
