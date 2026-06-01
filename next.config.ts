import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },

  async headers() {
    return [
      // ── Static assets: long cache + immutable (safe — these never change)
      {
        source: '/:path*.(jpg|jpeg|png|gif|webp|svg|ttf|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // ── Videos: NEVER immutable — must allow byte-range requests
      // Accept-Ranges tells Safari/Chrome it can request partial content.
      // no-transform prevents proxies/CDNs from re-encoding the file.
      // max-age=3600 is still a healthy cache; just not locked forever.
      {
        source: '/:path*.(mp4|webm)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, no-transform',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
        ],
      },
    ];
  },

  eslint:      { ignoreDuringBuilds: true },
  typescript:  { ignoreBuildErrors: true },
  experimental: {
    serverActions: { bodySizeLimit: '25mb' },
  },
};

export default withNextIntl(nextConfig);