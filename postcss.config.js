// FILE: postcss.config.js
// This file is REQUIRED to make the Vercel build pass.
// It uses the correct plugin for Tailwind v4.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
  },
};
