import { test, expect } from "@playwright/test";
import { TRIP } from "@/data/trip";
import photosData from "@/data/photos.json";
import type { PhotoEntry } from "@/lib/photos/types";

// Every page renders two parallel trees — `.mobile-only` and `.desktop-only`
// (see src/app/globals.css) — and CSS, not React, decides which one shows:
// both exist in the DOM at once, toggled by a `min-width: 1024px` media
// query. Playwright's default chromium project uses a desktop-sized
// viewport, which would make `.desktop-only` (a different component,
// DesktopApp, with its own headings and its own "/day/*" links, including
// PhotoGrid lightbox links that also start with "/day/") the visible one
// and turn every unscoped locator ambiguous or wrong. This app is
// mobile-first, so tests force a mobile viewport and scope every locator
// under `.mobile-only` to exercise that primary experience deterministically.
test.use({ viewport: { width: 390, height: 844 } });

// This repo ships without real media: public/photos is empty and gitignored,
// and NEXT_PUBLIC_PHOTOS_BASE_URL is unset by default (see README and
// src/lib/photos/url.ts, whose fallback is the placeholder host
// "https://photos.example.com"). Thumbnails therefore always fail to load in
// this checkout, by construction — that's a property of the environment, not
// a bug the assertion below should paper over.
//
// Read that once, up front: it decides which assertion the first test makes.
// A filter on console-error *text* (e.g. skip anything starting with
// "Failed to load resource:") would quietly swallow a genuine broken-image
// regression on a deployment that *does* have media configured — it hides a
// decision instead of stating it. An explicit boolean reads as a condition.
const mediaConfigured = Boolean(process.env.NEXT_PUBLIC_PHOTOS_BASE_URL);
const photosHost = (process.env.NEXT_PUBLIC_PHOTOS_BASE_URL ?? "https://photos.example.com")
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "");

// Every basename that exists anywhere in photos.json, regardless of variant
// or family flag. Used only to prove a rendered thumbnail URL corresponds to
// a real photos.json entry when media isn't configured — not to check
// family filtering (see e2e/family-privacy.spec.ts for that).
const knownBasenames = new Set(
  Object.values(photosData as Record<string, PhotoEntry[]>)
    .flat()
    .map((entry) => entry.url.slice(entry.url.lastIndexOf("/") + 1)),
);

test.describe("home page @smoke", () => {
  test("renders without runtime errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/");
    const mobile = page.locator(".mobile-only");

    // The hero <h1> renders TRIP.title (src/data/trip.ts) verbatim. Checking
    // for "an h1 is visible" would pass on a blank/placeholder heading; this
    // checks the actual trip data made it into the DOM.
    await expect(mobile.locator("h1")).toHaveText(TRIP.title);

    // These two figures are computed straight from TRIP (days.length,
    // totalKm), not hardcoded strings in the component. If trip data ever
    // failed to load (empty TRIP.days, undefined totalKm), these exact
    // strings would stop rendering — a blank/broken page can't fake them.
    // `exact: true` also rules out the days count also appearing inside the
    // gallery card's combined "N photos & vidéos · N jours" line.
    await expect(mobile.getByText(`${TRIP.days.length} jours`, { exact: true })).toBeVisible();
    await expect(mobile.getByText(`${TRIP.totalKm} km`, { exact: true })).toBeVisible();

    if (mediaConfigured) {
      // Real media is reachable: allow no runtime / unhandled errors at all.
      // Image 404s from broken photo entries would surface here too — this
      // is exactly the regression this assertion exists to catch, on the
      // deployments where it's meaningful.
      expect(consoleErrors).toEqual([]);
    } else {
      // No media in this checkout: thumbnails are guaranteed to fail to
      // load against the placeholder host, so console noise is expected and
      // deliberately not asserted on here. Assert the *shape* of the
      // produced URLs instead — the strongest signal available without
      // files on disk: every thumbnail must point at the configured photo
      // base (src/lib/photos/url.ts: resolveUrl + cfImageUrl) and its
      // basename must correspond to a real photos.json entry.
      const srcs = await mobile.locator("img").evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src),
      );
      const photoSrcs = srcs.filter((src) => src.includes(photosHost));

      expect(
        photoSrcs.length,
        "expected at least one thumbnail URL pointing at the configured photo base",
      ).toBeGreaterThan(0);

      for (const src of photoSrcs) {
        expect(src.startsWith(`https://${photosHost}/cdn-cgi/image/`), src).toBe(true);
        const basename = decodeURIComponent(src.slice(src.lastIndexOf("/") + 1));
        expect(knownBasenames.has(basename), `unknown basename in ${src}`).toBe(true);
      }
    }
  });

  test("links to a day page that itself loads", async ({ page }) => {
    await page.goto("/");
    const mobile = page.locator(".mobile-only");

    // First day link should resolve to /day/1 — the itinerary list always
    // starts at TRIP.days[0] (id 1), merged-day grouping notwithstanding.
    // Scoped to `.mobile-only`: an unscoped "a[href^=\"/day/\"]" also
    // matches PhotoGrid lightbox links ("/day/1/lightbox/0") rendered by
    // the parallel DesktopApp tree, and would click through to the wrong
    // page.
    const firstDay = TRIP.days[0];
    const dayLink = mobile.locator('a[href^="/day/"]').first();
    await expect(dayLink).toBeVisible();
    await dayLink.click();
    await expect(page).toHaveURL(new RegExp(`/day/${firstDay.id}$`));

    // The day page must show its own content, not just resolve to the
    // right URL: its <h1> is that day's title (TRIP.days[0].title), and its
    // "Les lieux" section lists that day's first place by name — both come
    // straight out of trip.data.ts, so an empty/broken day render can't
    // fake them.
    const dayMobile = page.locator(".mobile-only");
    await expect(dayMobile.locator("h1")).toHaveText(firstDay.title);
    await expect(dayMobile.getByText(firstDay.places[0].name, { exact: true })).toBeVisible();
  });
});
