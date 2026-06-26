import { test, expect } from "@playwright/test";

/**
 * The portfolio variant must hide every photo flagged family: true.
 * Since the staged photos.json has no family tags yet, this suite focuses on
 * the variant-aware *signals* that survive even without tagged data:
 * - the page title differs by variant
 * - the meta/title content includes "Carnet de voyage" in portfolio mode
 *
 * Once photos.json carries real family flags, add an assertion here that
 * matches a known family URL and verifies it never appears in the DOM.
 */
const variant = process.env.NEXT_PUBLIC_VARIANT ?? "full";

test.describe(`variant=${variant} branding (smoke)`, () => {
  test("home page title matches the variant", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    if (variant === "portfolio") {
      expect(title).toContain("Carnet de voyage");
    } else {
      // Full variant keeps the private, short title.
      expect(title).not.toContain("Carnet de voyage");
      expect(title.length).toBeGreaterThan(0);
    }
  });
});
