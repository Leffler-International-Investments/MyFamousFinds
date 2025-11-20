// FILE: /next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Webpack instead of Turbopack
  experimental: {
    turbo: false
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
};

module.exports = nextConfig;
