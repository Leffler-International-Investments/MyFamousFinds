const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ STOP using Turbopack
  turbopack: false,

  // Or for older versions:
  experimental: {
    turbo: false,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },

  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;
