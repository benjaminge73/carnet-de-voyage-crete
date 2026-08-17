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
// test.describe("home page (smoke)", () => {
//   test("renders without runtime errors", async ({ page }) => {
//     const consoleErrors: string[] = [];
//     page.on("pageerror", (err) => consoleErrors.push(String(err)));
//     page.on("console", (msg) => {
//       if (msg.type() !== "error") return;
//       // This repo ships without real media (public/photos is empty and
//       // gitignored, NEXT_PUBLIC_PHOTOS_BASE_URL unset — see README), so day
//       // thumbnails always try to load real photos.json URLs against the
//       // placeholder host and always fail. That's expected here and would be
//       // a real bug on a deployment with photos actually configured (where
//       // this same filter would let a genuine broken-image regression
//       // through) — it's this specific checkout's lack of media that makes it
//       // noise, not the assertion's intent.
//       if (msg.text().startsWith("Failed to load resource:")) return;
//       consoleErrors.push(msg.text());
//     });
//
//     await page.goto("/");
//     // The hero h1 is the most reliable anchor across both variants.
//     await expect(page.locator("h1, h2").first()).toBeVisible();
//
//     // Allow no runtime / unhandled JS errors (uncaught exceptions or
//     // explicit console.error calls from app code).
//     expect(consoleErrors).toEqual([]);
//   });
//
//   test("links to a day page that itself loads", async ({ page }) => {
//     await page.goto("/");
//     // First day link should resolve to /day/1.
//     const dayLink = page.locator('a[href^="/day/"]').first();
//     await expect(dayLink).toBeVisible();
//     await dayLink.click();
//     await expect(page).toHaveURL(/\/day\/\d+/);
//   });
// });
