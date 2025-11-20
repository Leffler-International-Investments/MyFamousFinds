// FILE: /next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔴 IMPORTANT: force Webpack, disable Turbopack
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
