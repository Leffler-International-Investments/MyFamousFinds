// FILE: /next.config.js

const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ No invalid experimental.turbo here
  experimental: {},

  // ✅ Tell Next 16: “yes, I know I’m using Turbopack”
  turbopack: {},

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },

  // ✅ Keep your alias config
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;
