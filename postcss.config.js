// FILE: postcss.config.js
//
// This is the fix for the build log error.
// The build is failing because Vercel is using an old, cached
// version of this file from a previous build.
//
// This correct version uses the '@tailwindcss/postcss' plugin,
// which is required by Tailwind v4 (in your package.json).
//
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
  },
};
