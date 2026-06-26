import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("@/data/photos.json", () => ({
  default: {
    p1a: [
      { url: "/photos/c.mp4", datetime: "2026-04-21T08:00:00.000Z", lat: 35.1, lng: 25.1, kind: "video" },
      { url: "/photos/a.jpg", datetime: "2026-04-21T10:00:00.000Z", lat: 35.1, lng: 25.1 },
      { url: "/photos/b.jpg", datetime: "2026-04-21T11:00:00.000Z", lat: 35.1, lng: 25.1 },
    ],
    p1b: [
      { url: "/photos/d.jpg", datetime: "2026-04-21T15:00:00.000Z", lat: 35.1, lng: 25.1 },
    ],
    // p2a deliberately has no photos and no day-level fallback
  },
}));

vi.mock("@/data/trip", () => ({
  TRIP: {
    days: [
      {
        id: 1,
        places: [
          { id: "p1a", mediaCount: 99 },
          { id: "p1b", mediaCount: 50 },
        ],
      },
      {
        id: 2,
        places: [{ id: "p2a", mediaCount: 7 }],
      },
    ],
  },
}));

afterEach(() => vi.resetModules());

describe("hero.ts — getHeroPhotoForPlace", () => {
  it("prefers a non-video photo even when the video comes first", async () => {
    const { getHeroPhotoForPlace } = await import("./hero");
    const hero = getHeroPhotoForPlace("p1a");
    expect(hero?.kind).not.toBe("video");
    expect(hero?.url).toContain("/a.jpg");
  });

  it("returns null when the place has no photos and no day fallback", async () => {
    const { getHeroPhotoForPlace } = await import("./hero");
    const hero = getHeroPhotoForPlace("p2a");
    expect(hero).toBeNull();
  });

  it("returns null for an unknown placeId", async () => {
    const { getHeroPhotoForPlace } = await import("./hero");
    expect(getHeroPhotoForPlace("nope")).toBeNull();
  });
});
