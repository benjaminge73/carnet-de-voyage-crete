import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      "e2e/**",
      "playwright.config.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default eslintConfig;
