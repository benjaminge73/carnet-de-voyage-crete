// ═══════════════════════════════════════════════════════════════════════════
// SUITE DÉSACTIVÉE le 2026-08-17 — décision de Benjamin.
//
// Ces tests ne couvrent pas ce qu'ils ont l'air de couvrir. L'assertion qui
// compte — le filtre des photos `family` — est encore un TODO, et 3 des 6
// tests ne vérifient que l'anti-indexation. Les laisser actifs revenait à
// offrir une preuve verte à la garde nocturne pour une couverture qui ne la
// justifie pas, donc à rendre possible un merge automatique gagné sur du vide.
//
// Tant que cette suite est commentée, les PR Dependabot de ce repo restent
// VOLONTAIREMENT bloquées en `review-required`. C'est l'effet recherché.
//
// POUR RÉACTIVER — les trois gestes vont ensemble, sinon l'état est incohérent :
//   1. décommenter ce fichier ET ses voisins de `e2e/` ;
//   2. réactiver les étapes Playwright dans `.github/workflows/ci.yml` ;
//   3. remettre `e2e_command` pour ce repo dans `review_checks`
//      (hermes-custom, `scripts/dependabot_night_watch.py`).
//
// Suivi : [Plan] Projets Vercel - Tests e2e Playwright
// https://app.notion.com/p/3b6b8cc8aa1d819d9120e2d53086d7d7
// ═══════════════════════════════════════════════════════════════════════════

// import { test, expect } from "@playwright/test";
//
// test.describe("anti-crawl (smoke)", () => {
//   test("/robots.txt disallows everything", async ({ request }) => {
//     const res = await request.get("/robots.txt");
//     expect(res.status()).toBe(200);
//     const body = await res.text();
//     // Next's MetadataRoute.Robots generator capitalizes "User-Agent";
//     // the robots.txt spec treats directive names as case-insensitive.
//     expect(body).toContain("User-Agent: *");
//     expect(body).toContain("Disallow: /");
//   });
//
//   test("every page returns X-Robots-Tag headers", async ({ request }) => {
//     const res = await request.get("/");
//     expect(res.status()).toBe(200);
//     const header = res.headers()["x-robots-tag"] ?? "";
//     expect(header).toContain("noindex");
//     expect(header).toContain("nofollow");
//   });
//
//   test("meta robots tag is set in the HTML head", async ({ page }) => {
//     await page.goto("/");
//     const content = await page.locator('meta[name="robots"]').getAttribute("content");
//     expect(content).toContain("noindex");
//     expect(content).toContain("nofollow");
//   });
// });
