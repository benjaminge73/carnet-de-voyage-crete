import { test, expect, type Page } from "@playwright/test";
import photosData from "@/data/photos.json";
import type { PhotoEntry } from "@/lib/photos/types";

/**
 * The one assertion that was missing since day one: the `family` filter
 * itself. `applyVariantFilter` (src/lib/photos/selector.ts) is supposed to
 * strip every photo flagged `family: true` from the portfolio variant — this
 * spec is the proof.
 *
 * Why match on basename against served HTML, and not on a hardcoded witness
 * URL or a path prefix:
 * - The photo folders (/photos/traveler-1, /photos/traveler-2, ...) mix
 *   family and non-family photos — measured, not assumed. A path-prefix
 *   assertion is impossible here.
 * - A hardcoded witness URL would rot on the next `extract-exif.mjs`
 *   re-export. Deriving the family set from photos.json itself keeps this
 *   spec correct as long as the JSON is correct.
 * - The basename is the one token that survives `resolveUrl` (swaps
 *   `/photos/...` for the configured photo base) and `cfImageUrl` (wraps the
 *   URL in `/cdn-cgi/image/<params>/https://...`) — both transform
 *   everything around it, but the filename itself is always the tail of the
 *   string. This holds even in this checkout, which has no real media: the
 *   URL string is still built and served in the HTML, only the bytes behind
 *   it 404.
 * - We compare against `page.content()` (the served HTML), not Playwright
 *   locators, so a leaked URL sitting in an unrendered attribute (e.g. a
 *   `srcset` on an off-screen image) still gets caught.
 *
 * Two mirrored assertions, one file, so a single spec can serve both legs of
 * the CI variant matrix:
 * - portfolio: none of the family basenames may appear in the HTML.
 * - full: all of the family basenames must appear (regression guard against
 *   a filter that silently drops everything, on either variant).
 */

const variant = process.env.NEXT_PUBLIC_VARIANT ?? "full";

function basename(url: string): string {
  return url.slice(url.lastIndexOf("/") + 1);
}

const familyBasenames = Array.from(
  new Set(
    Object.values(photosData as Record<string, PhotoEntry[]>)
      .flat()
      .filter((entry) => entry.family)
      .map((entry) => basename(entry.url)),
  ),
);

// Routes /place/p2a and /place/p3b exist in this repo's trip data
// (src/data/trip.data.ts: day 2's "Fort vénitien & musée archéologique" and
// day 3's "Grotte de l'Ida"), and photos.json carries family-tagged entries
// under both place ids — same shape as the twin repo this spec is ported
// from. "/gallery" alone accounts for every tagged photo, making it the
// single most discriminating route — the other three are kept too so a
// regression scoped to one page/component doesn't slip through.
const ROUTES = ["/", "/gallery", "/place/p2a", "/place/p3b"];

// Basenames containing spaces survive resolveUrl/cfImageUrl as a token, but
// the HTML Next.js serves encodes the space as %20. Normalize before
// comparing, or any such file is a guaranteed false negative.
function normalizeHtml(html: string): string {
  return html.replace(/%20/g, " ");
}

async function collectHtmlByRoute(page: Page): Promise<Map<string, string>> {
  const byRoute = new Map<string, string>();
  for (const route of ROUTES) {
    await page.goto(route);
    byRoute.set(route, normalizeHtml(await page.content()));
  }
  return byRoute;
}

test.describe(`variant=${variant} family photo privacy @smoke`, () => {
  test("family-tagged photos exist to assert against", () => {
    // Guards against a vacuous pass: if photos.json ever ends up with zero
    // family: true entries, both tests below would trivially pass without
    // having checked anything.
    expect(
      familyBasenames.length,
      "photos.json has no family: true entries — the assertions below would be vacuous",
    ).toBeGreaterThan(0);
  });

  test("portfolio variant never serves a family-tagged photo", async ({ page }) => {
    test.skip(
      variant !== "portfolio",
      `this test only runs under NEXT_PUBLIC_VARIANT=portfolio (current: "${variant}")`,
    );

    const htmlByRoute = await collectHtmlByRoute(page);

    const leaks: string[] = [];
    for (const name of familyBasenames) {
      for (const [route, html] of htmlByRoute) {
        if (html.includes(name)) leaks.push(`${name} (leaked on ${route})`);
      }
    }

    expect(
      leaks,
      `family-tagged photo(s) leaked into portfolio HTML:\n${leaks.join("\n")}`,
    ).toEqual([]);
  });

  test("full variant serves every family-tagged photo", async ({ page }) => {
    test.skip(
      variant !== "full",
      `this test only runs under NEXT_PUBLIC_VARIANT=full (current: "${variant}")`,
    );

    const htmlByRoute = await collectHtmlByRoute(page);
    const combinedHtml = Array.from(htmlByRoute.values()).join("\n");

    const missing = familyBasenames.filter((name) => !combinedHtml.includes(name));

    expect(
      missing,
      `family-tagged photo(s) missing from full-variant HTML across ${ROUTES.join(", ")}:\n${missing.join("\n")}`,
    ).toEqual([]);
  });
});
