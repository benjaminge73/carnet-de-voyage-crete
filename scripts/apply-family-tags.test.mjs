import { describe, it, expect } from "vitest";
import { applyTags } from "./apply-family-tags.mjs";

const baseline = () => ({
  p1a: [
    { url: "/photos/a.jpg", datetime: "2026-04-21T10:00:00.000Z", lat: 1, lng: 1 },
    { url: "/photos/b.jpg", datetime: "2026-04-21T11:00:00.000Z", lat: 1, lng: 1, family: true },
  ],
  p1b: [{ url: "/photos/c.jpg", datetime: null, lat: null, lng: null }],
  _day_1: [{ url: "/photos/day.jpg", datetime: "2026-04-21T09:00:00.000Z", lat: 1, lng: 1 }],
});

describe("applyTags", () => {
  it("adds family: true on photos newly marked", () => {
    const photos = baseline();
    const { photos: out, summary } = applyTags(photos, {
      "/photos/a.jpg": { family: true, faceRatio: 0.12 },
    });
    expect(out.p1a[0].family).toBe(true);
    expect(summary.added).toBe(1);
    expect(summary.removed).toBe(0);
  });

  it("strips the family field when marked false (never writes family: false)", () => {
    const photos = baseline();
    const { photos: out, summary } = applyTags(photos, {
      "/photos/b.jpg": { family: false, faceRatio: 0.01 },
    });
    expect("family" in out.p1a[1]).toBe(false);
    expect(summary.removed).toBe(1);
  });

  it("is idempotent: re-applying the same tags is a no-op", () => {
    const photos = baseline();
    const tags = { "/photos/b.jpg": { family: true, faceRatio: 0.2 } };
    const first = applyTags(photos, tags).photos;
    const { summary } = applyTags(first, tags);
    expect(summary.added).toBe(0);
    expect(summary.removed).toBe(0);
    expect(summary.updated).toBe(0);
  });

  it("leaves photos not mentioned in tags untouched", () => {
    const photos = baseline();
    const { photos: out } = applyTags(photos, {
      "/photos/a.jpg": { family: true, faceRatio: 0.2 },
    });
    expect(out.p1b[0]).toEqual(photos.p1b[0]);
    expect(out._day_1[0]).toEqual(photos._day_1[0]);
  });

  it("reports unknown tag URLs without crashing", () => {
    const photos = baseline();
    const { summary } = applyTags(photos, {
      "/photos/never-existed.jpg": { family: true, faceRatio: 0.5 },
    });
    expect(summary.unknown).toContain("/photos/never-existed.jpg");
    expect(summary.added).toBe(0);
  });

  it("preserves all other fields of a PhotoEntry", () => {
    const photos = baseline();
    const { photos: out } = applyTags(photos, {
      "/photos/a.jpg": { family: true, faceRatio: 0.2 },
    });
    expect(out.p1a[0]).toMatchObject({
      url: "/photos/a.jpg",
      datetime: "2026-04-21T10:00:00.000Z",
      lat: 1,
      lng: 1,
      family: true,
    });
  });

  it("does not mutate the input photos object", () => {
    const photos = baseline();
    const original = JSON.parse(JSON.stringify(photos));
    applyTags(photos, { "/photos/a.jpg": { family: true, faceRatio: 0.2 } });
    expect(photos).toEqual(original);
  });
});
