// FILE: /next.config.js

const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ REMOVE invalid turbo option
  // experimental: { turbo: false },

  // ✅ Keep experimental section empty or delete it entirely
  experimental: {},

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
