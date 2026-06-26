import { describe, it, expect } from "vitest";
import {
  TRIP,
  MERGED_INTO,
  MERGED_FROM,
  MERGED_CHILD_IDS,
  mergedDayIdsFor,
} from "./trip";
import photosData from "./photos.json";

const photos = photosData as Record<string, unknown>;

const CRETE_BOUNDS = { latMin: 34.8, latMax: 35.8, lngMin: 23.4, lngMax: 26.4 };
const PLACE_ID_RE = /^p\d+[a-z]$/;

describe("trip.ts invariants", () => {
  it("has 10 days numbered 1..10", () => {
    const ids = TRIP.days.map((d) => d.id);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("every place id matches p{N}{letter} and is globally unique", () => {
    const allIds = TRIP.days.flatMap((d) => d.places.map((p) => p.id));
    for (const id of allIds) expect(id).toMatch(PLACE_ID_RE);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("every place lat/lng falls inside Crete bounds", () => {
    for (const day of TRIP.days) {
      for (const place of day.places) {
        expect(place.lat).toBeGreaterThanOrEqual(CRETE_BOUNDS.latMin);
        expect(place.lat).toBeLessThanOrEqual(CRETE_BOUNDS.latMax);
        expect(place.lng).toBeGreaterThanOrEqual(CRETE_BOUNDS.lngMin);
        expect(place.lng).toBeLessThanOrEqual(CRETE_BOUNDS.lngMax);
      }
    }
  });

  it("every place referenced in photos.json exists in trip (or is a _day_N key)", () => {
    const tripIds = new Set(TRIP.days.flatMap((d) => d.places.map((p) => p.id)));
    const dayIds = new Set(TRIP.days.map((d) => `_day_${d.id}`));
    for (const key of Object.keys(photos)) {
      const valid = tripIds.has(key) || dayIds.has(key);
      expect(valid, `photos.json key "${key}" not in trip`).toBe(true);
    }
  });

  it("totalKm and totalPhotos are positive numbers", () => {
    expect(TRIP.totalKm).toBeGreaterThan(0);
    expect(TRIP.totalPhotos).toBeGreaterThan(0);
  });
});

describe("MERGED_INTO and helpers", () => {
  it("MERGED_INTO references only known day ids", () => {
    const dayIds = new Set(TRIP.days.map((d) => d.id));
    for (const [parent, children] of Object.entries(MERGED_INTO)) {
      expect(dayIds.has(Number(parent))).toBe(true);
      for (const child of children) expect(dayIds.has(child)).toBe(true);
    }
  });

  it("MERGED_FROM is the inverse of MERGED_INTO (involution)", () => {
    for (const [parent, children] of Object.entries(MERGED_INTO)) {
      for (const child of children) {
        expect(MERGED_FROM[child]).toBe(Number(parent));
      }
    }
    // No orphan entries in MERGED_FROM
    for (const [child, parent] of Object.entries(MERGED_FROM)) {
      expect(MERGED_INTO[parent]?.includes(Number(child))).toBe(true);
    }
  });

  it("MERGED_CHILD_IDS contains every child id and nothing else", () => {
    const expected = new Set(Object.values(MERGED_INTO).flat());
    expect(MERGED_CHILD_IDS).toEqual(expected);
  });

  it("mergedDayIdsFor returns the day itself plus its merged children", () => {
    expect(mergedDayIdsFor(1)).toEqual([1, 2]);
    expect(mergedDayIdsFor(3)).toEqual([3]);
  });

  it("a child day is never also a parent (no chains)", () => {
    for (const child of MERGED_CHILD_IDS) {
      expect(MERGED_INTO[child]).toBeUndefined();
    }
  });
});
