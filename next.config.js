// FILE: /next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 👇 This line is the important bit for Next 16
  turbopack: {},

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },

  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;
