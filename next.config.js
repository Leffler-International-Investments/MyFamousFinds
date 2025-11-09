// FILE: next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // ✅ Explicitly opt into Turbopack with an empty config
  //    This silences the “webpack config and no turbopack config” error.
  turbopack: {},

  // ✅ Remote images (replacement for deprecated images.domains)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "famous-finds.vercel.app",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

module.exports = nextConfig;
