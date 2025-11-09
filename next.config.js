// FILE: /next.config.js
/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      // ✅ Allow listing images from Firebase Storage
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },

  // Your existing custom webpack config
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },

  // ✅ Required for Next 16 when you have a webpack config
  // This tells Next "yes, I'm intentionally using Turbopack"
  turbopack: {},
};

module.exports = nextConfig;
