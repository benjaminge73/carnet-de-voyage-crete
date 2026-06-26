import type { MetadataRoute } from "next";

// Disallow every crawler on every path, for both the full and portfolio
// variants. This protects the Cloudflare Image Resizing free-tier quota
// (5 000 transforms / month) and keeps the trip log out of search engines.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "Bytespider",
  "Amazonbot",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "FacebookBot",
  "cohere-ai",
  "Diffbot",
  "ImagesiftBot",
  "Omgili",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", disallow: "/" },
      ...AI_BOTS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
  };
}
