// FILE: postcss.config.js
//
// THIS IS THE ONLY FILE YOU NEED TO FIX.
//
// Your package.json uses Tailwind v4, which REQUIRES
// the plugin to be '@tailwindcss/postcss'.
//
// The build is failing because your project still has the old file.
//
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
  },
};
