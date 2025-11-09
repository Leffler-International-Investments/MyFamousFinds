// FILE: postcss.config.js
// VERCEL CACHE-BUSTING CHANGE v2
//
// This file is correct. The build is failing from a cache.
//
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
  },
};
