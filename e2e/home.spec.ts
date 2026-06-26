import { test, expect } from "@playwright/test";

test.describe("home page (smoke)", () => {
  test("renders without runtime errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/");
    // The hero h1 is the most reliable anchor across both variants.
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Allow no runtime / unhandled errors. Image 404s from broken R2 entries
    // would surface here too — we want them caught early in CI.
    expect(consoleErrors).toEqual([]);
  });

  test("links to a day page that itself loads", async ({ page }) => {
    await page.goto("/");
    // First day link should resolve to /day/1.
    const dayLink = page.locator('a[href^="/day/"]').first();
    await expect(dayLink).toBeVisible();
    await dayLink.click();
    await expect(page).toHaveURL(/\/day\/\d+/);
  });
});
