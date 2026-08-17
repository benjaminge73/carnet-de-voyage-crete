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
// /**
//  * The portfolio variant must hide every photo flagged family: true.
//  * Since the staged photos.json has no family tags yet, this suite focuses on
//  * the variant-aware *signals* that survive even without tagged data:
//  * - the page title differs by variant
//  * - the meta/title content includes "Carnet de voyage" in portfolio mode
//  *
//  * Once photos.json carries real family flags, add an assertion here that
//  * matches a known family URL and verifies it never appears in the DOM.
//  */
// const variant = process.env.NEXT_PUBLIC_VARIANT ?? "full";
//
// test.describe(`variant=${variant} branding (smoke)`, () => {
//   test("home page title matches the variant", async ({ page }) => {
//     await page.goto("/");
//     const title = await page.title();
//     if (variant === "portfolio") {
//       expect(title).toContain("Carnet de voyage");
//     } else {
//       // Full variant keeps the private, short title.
//       expect(title).not.toContain("Carnet de voyage");
//       expect(title.length).toBeGreaterThan(0);
//     }
//   });
// });
