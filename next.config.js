// FILE: next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // ✅ Enable Turbopack explicitly (avoids “webpack config” conflict)
  experimental: {
    turbo: {
      rules: {},
    },
  },

  // ✅ Allow remote images for product listings, etc.
  images: {
    domains: [
      "images.unsplash.com",
      "famous-finds.vercel.app",
      "cdn.shopify.com",
      "res.cloudinary.com",
    ],
  },

  // ✅ PostCSS & Tailwind compatibility for Next 16
  webpack(config) {
    return config;
  },
};

export default nextConfig;
