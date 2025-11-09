// FILE: /postcss.config.js

/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    // ✅ New Tailwind v4 PostCSS plugin
    "@tailwindcss/postcss": {},

    // ✅ Keep autoprefixer
    autoprefixer: {},
  },
};
