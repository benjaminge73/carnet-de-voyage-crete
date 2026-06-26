import type { NextConfig } from "next";

// Host that serves the photos. Override with NEXT_PUBLIC_PHOTOS_BASE_URL to
// point next/image at your own object store; defaults to a placeholder host.
const PHOTOS_HOST = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_PHOTOS_BASE_URL ?? "https://photos.example.com",
    ).hostname;
  } catch {
    return "photos.example.com";
  }
})();

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: PHOTOS_HOST,
        pathname: "/cdn-cgi/image/**",
      },
      {
        protocol: "https",
        hostname: PHOTOS_HOST,
        pathname: "/**",
      },
    ],
    // Only the lightbox full-screen view uses next/image now. Keep its cache
    // for 1 year and limit the number of generated variants to minimize
    // Vercel Image Optimization cache writes (free tier = 100k/mo).
    minimumCacheTTL: 31536000,
    formats: ["image/webp"],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [],
  },
  // Defense in depth: every response carries X-Robots-Tag so caches/CDNs and
  // crawlers that ignore meta tags still see the directive. Same on both
  // variants — neither site should ever be indexed.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
        ],
      },
    ];
  },
};

export default nextConfig;
