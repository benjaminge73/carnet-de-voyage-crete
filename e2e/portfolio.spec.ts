import { test, expect } from "@playwright/test";

/**
 * The portfolio variant must hide every photo flagged family: true.
 * This suite focuses on the variant-aware *signals* that don't depend on
 * tagged photo data:
 * - the page title differs by variant
 * - the meta/title content includes "Carnet de voyage" in portfolio mode
 *
 * The family-tag assertion itself lives in e2e/family-privacy.spec.ts.
 */
const variant = process.env.NEXT_PUBLIC_VARIANT ?? "full";

test.describe(`variant=${variant} branding @smoke`, () => {
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
