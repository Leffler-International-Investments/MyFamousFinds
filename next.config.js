// FILE: /next.config.js

const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ No invalid experimental.turbo here
  experimental: {},

  // ✅ Tell Next 16: "yes, I know I'm using Turbopack"
  turbopack: {},

  // Enable static export for Capacitor mobile builds (set NEXT_EXPORT=true)
  ...(process.env.NEXT_EXPORT === "true" ? { output: "export" } : {}),

  images: {
    // Use unoptimized images for static export (Capacitor)
    ...(process.env.NEXT_EXPORT === "true" ? { unoptimized: true } : {}),
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // Mark native ONNX packages as external so webpack doesn't try to bundle them
  serverExternalPackages: [
    "@imgly/background-removal-node",
    "onnxruntime-node",
  ],

  webpack: (config, { isServer }) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("onnxruntime-node");
    }
    return config;
  },
};

module.exports = nextConfig;
