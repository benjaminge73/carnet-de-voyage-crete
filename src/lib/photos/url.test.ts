import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const R2_DEFAULT = "https://photos.example.com";

describe("url.ts — resolveUrl + PHOTOS_BASE", () => {
  // Snapshot whatever the shell injected (CI matrix may set unrelated vars),
  // so each test starts from a known state and we restore at the end.
  const shellBase = process.env.NEXT_PUBLIC_PHOTOS_BASE_URL;
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_PHOTOS_BASE_URL;
    vi.resetModules();
  });
  afterEach(() => {
    if (shellBase === undefined) delete process.env.NEXT_PUBLIC_PHOTOS_BASE_URL;
    else process.env.NEXT_PUBLIC_PHOTOS_BASE_URL = shellBase;
    vi.resetModules();
  });

  it("rewrites /photos/* paths to the default R2 domain when no env override", async () => {
    delete process.env.NEXT_PUBLIC_PHOTOS_BASE_URL;
    vi.resetModules();
    const { resolveUrl } = await import("./url");
    expect(
      resolveUrl({ url: "/photos/a.jpg", datetime: null, lat: null, lng: null }).url,
    ).toBe(`${R2_DEFAULT}/a.jpg`);
  });

  it("honors NEXT_PUBLIC_PHOTOS_BASE_URL override", async () => {
    process.env.NEXT_PUBLIC_PHOTOS_BASE_URL = "https://custom.example.com";
    vi.resetModules();
    const { resolveUrl } = await import("./url");
    expect(
      resolveUrl({ url: "/photos/a.jpg", datetime: null, lat: null, lng: null }).url,
    ).toBe("https://custom.example.com/a.jpg");
  });

  it("leaves absolute URLs untouched", async () => {
    const { resolveUrl } = await import("./url");
    const absolute = { url: "https://example.com/x.jpg", datetime: null, lat: null, lng: null };
    expect(resolveUrl(absolute).url).toBe("https://example.com/x.jpg");
  });
});

describe("url.ts — cfImageUrl + snapWidth + thumbnailUrl", () => {
  beforeEach(() => vi.resetModules());

  it("rewrites R2 URLs to Cloudflare Image Resizing path", async () => {
    const { cfImageUrl } = await import("./url");
    const out = cfImageUrl(`${R2_DEFAULT}/a.jpg`, { width: 400 });
    expect(out).toContain("/cdn-cgi/image/");
    expect(out).toContain("width=400");
    expect(out).toContain("format=auto");
    expect(out).toContain("quality=70");
    expect(out.endsWith(`${R2_DEFAULT}/a.jpg`)).toBe(true);
  });

  it("includes height + fit when provided", async () => {
    const { cfImageUrl } = await import("./url");
    const out = cfImageUrl(`${R2_DEFAULT}/a.jpg`, { width: 96, height: 96, resize: "cover" });
    expect(out).toContain("height=96");
    expect(out).toContain("fit=cover");
  });

  it("leaves non-R2 URLs unchanged", async () => {
    const { cfImageUrl } = await import("./url");
    expect(cfImageUrl("https://other.example.com/x.jpg", { width: 400 })).toBe(
      "https://other.example.com/x.jpg",
    );
  });

  it("snapWidth picks smallest canonical width >= target", async () => {
    const { snapWidth } = await import("./url");
    expect(snapWidth(100)).toBe(200);
    expect(snapWidth(200)).toBe(200);
    expect(snapWidth(201)).toBe(400);
    expect(snapWidth(800)).toBe(800);
    expect(snapWidth(801)).toBe(1200);
    expect(snapWidth(5000)).toBe(1200);
  });

  it("thumbnailUrl produces square cover-cropped URL", async () => {
    const { thumbnailUrl } = await import("./url");
    const out = thumbnailUrl(`${R2_DEFAULT}/a.jpg`, 96);
    expect(out).toContain("width=96");
    expect(out).toContain("height=96");
    expect(out).toContain("fit=cover");
  });
});
