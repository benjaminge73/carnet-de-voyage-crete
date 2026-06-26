import { test, expect } from "@playwright/test";

test.describe("anti-crawl (smoke)", () => {
  test("/robots.txt disallows everything", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Disallow: /");
  });

  test("every page returns X-Robots-Tag headers", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
    const header = res.headers()["x-robots-tag"] ?? "";
    expect(header).toContain("noindex");
    expect(header).toContain("nofollow");
  });

  test("meta robots tag is set in the HTML head", async ({ page }) => {
    await page.goto("/");
    const content = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(content).toContain("noindex");
    expect(content).toContain("nofollow");
  });
});
