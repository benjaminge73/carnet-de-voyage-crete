import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from "vitest";

// Most tests assume the default ("full") variant. Save the shell value so we
// can restore it after we mutate it in the portfolio describe; force full
// before every test so the suite passes regardless of the env the shell
// inherited (matters when CI runs the matrix job NEXT_PUBLIC_VARIANT=portfolio).
const SHELL_VARIANT = process.env.NEXT_PUBLIC_VARIANT;
beforeEach(() => {
  delete process.env.NEXT_PUBLIC_VARIANT;
  vi.resetModules();
});
afterAll(() => {
  if (SHELL_VARIANT === undefined) delete process.env.NEXT_PUBLIC_VARIANT;
  else process.env.NEXT_PUBLIC_VARIANT = SHELL_VARIANT;
});

vi.mock("@/data/photos.json", () => ({
  default: {
    p1a: [
      { url: "/photos/a.jpg", datetime: "2026-04-21T10:00:00.000Z", lat: 35.1, lng: 25.1 },
      { url: "/photos/b.jpg", datetime: "2026-04-21T11:00:00.000Z", lat: 35.1, lng: 25.1, family: true },
      { url: "/photos/c.mp4", datetime: "2026-04-21T12:00:00.000Z", lat: 35.1, lng: 25.1, kind: "video" },
    ],
    p1b: [
      { url: "/photos/d.jpg", datetime: null, lat: null, lng: null },
      { url: "/photos/e.jpg", datetime: "2026-04-21T15:00:00.000Z", lat: 35.1, lng: 25.1 },
      { url: "/photos/f.jpg", datetime: "2026-04-21T17:00:00.000Z", lat: 35.1, lng: 25.1, family: true },
    ],
    _day_1: [
      { url: "/photos/day1.jpg", datetime: "2026-04-21T09:00:00.000Z", lat: 35.1, lng: 25.1 },
    ],
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

const R2_DEFAULT = "https://photos.example.com";

describe("selector.ts — getPhotosForPlace", () => {
  it("rewrites /photos/* URLs through PHOTOS_BASE", async () => {
    const { getPhotosForPlace } = await import("./selector");
    const photos = getPhotosForPlace("p1a");
    expect(photos[0].url).toBe(`${R2_DEFAULT}/a.jpg`);
    expect(photos[1].url).toBe(`${R2_DEFAULT}/b.jpg`);
  });

  it("returns [] for unknown placeId", async () => {
    const { getPhotosForPlace } = await import("./selector");
    expect(getPhotosForPlace("nonexistent")).toEqual([]);
  });

  it("fills missing datetime with median of siblings", async () => {
    const { getPhotosForPlace } = await import("./selector");
    const p1b = getPhotosForPlace("p1b");
    const filled = p1b.find((p) => p.url.endsWith("/d.jpg"));
    expect(filled?.datetime).toBe("2026-04-21T17:00:00.000Z");
  });
});

describe("selector.ts — getPhotosForDay", () => {
  it("sorts day photos chronologically across places + _day_N", async () => {
    const { getPhotosForDay } = await import("./selector");
    const day = getPhotosForDay(1);
    const dts = day.map((p) => p.datetime);
    const sorted = [...dts].sort();
    expect(dts).toEqual(sorted);
    expect(day.some((p) => p.url.endsWith("/day1.jpg"))).toBe(true);
  });

  it("returns [] for unknown dayId", async () => {
    const { getPhotosForDay } = await import("./selector");
    expect(getPhotosForDay(99)).toEqual([]);
  });
});

describe("selector.ts — portfolio variant filter", () => {
  // The outer beforeEach already deletes NEXT_PUBLIC_VARIANT before each test,
  // so each portfolio test must opt back in explicitly.
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_VARIANT;
  });

  it("hides photos with family:true when NEXT_PUBLIC_VARIANT=portfolio", async () => {
    process.env.NEXT_PUBLIC_VARIANT = "portfolio";
    vi.resetModules();
    const { getPhotosForPlace } = await import("./selector");
    const urls = getPhotosForPlace("p1a").map((p) => p.url);
    expect(urls.some((u) => u.endsWith("/b.jpg"))).toBe(false); // family:true → filtered
    expect(urls.some((u) => u.endsWith("/a.jpg"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/c.mp4"))).toBe(true);
  });

  it("shows family photos by default (full variant)", async () => {
    delete process.env.NEXT_PUBLIC_VARIANT;
    vi.resetModules();
    const { getPhotosForPlace } = await import("./selector");
    const urls = getPhotosForPlace("p1a").map((p) => p.url);
    expect(urls.some((u) => u.endsWith("/b.jpg"))).toBe(true);
  });

  it("portfolio variant filters family photos out of day-level results too", async () => {
    process.env.NEXT_PUBLIC_VARIANT = "portfolio";
    vi.resetModules();
    const { getPhotosForDay } = await import("./selector");
    const urls = getPhotosForDay(1).map((p) => p.url);
    expect(urls.some((u) => u.endsWith("/b.jpg"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/f.jpg"))).toBe(false);
  });

  it("portfolio variant counts only visible photos", async () => {
    process.env.NEXT_PUBLIC_VARIANT = "portfolio";
    vi.resetModules();
    const { getPhotoCount, getMediaCountsForDay } = await import("./selector");
    expect(getPhotoCount("p1a")).toBe(2); // a + c.mp4 (b filtered out)
    const counts = getMediaCountsForDay(1);
    // p1a: a, c.mp4 (b filtered) → 1 photo + 1 video
    // p1b: d, e (f filtered) → 2 photos
    // _day_1: day1 → 1 photo
    // total: 4 photos + 1 video
    expect(counts.photos).toBe(4);
    expect(counts.videos).toBe(1);
  });
});

describe("selector.ts — counts", () => {
  it("getPhotoCount returns actual count when present", async () => {
    const { getPhotoCount } = await import("./selector");
    expect(getPhotoCount("p1a")).toBe(3);
  });

  it("getPhotoCount falls back to mediaCount when no photos", async () => {
    const { getPhotoCount } = await import("./selector");
    expect(getPhotoCount("p2a")).toBe(7);
  });

  it("getMediaCountsForDay splits photos vs videos", async () => {
    const { getMediaCountsForDay } = await import("./selector");
    const counts = getMediaCountsForDay(1);
    expect(counts.videos).toBe(1);
    expect(counts.photos).toBeGreaterThanOrEqual(4);
  });

  it("getTotalPhotoCount sums real counts and mediaCount fallbacks", async () => {
    const { getTotalPhotoCount } = await import("./selector");
    // p1a=3 (real), p1b=3 (real), p2a=7 (fallback) → 13
    expect(getTotalPhotoCount()).toBe(13);
  });
});
