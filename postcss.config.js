// FILE: postcss.config.js
//
// The build is failing because this file is wrong.
//
// Your package.json uses Tailwind v4, which REQUIRES
// the plugin to be '@tailwindcss/postcss'.
//
// This is the only file you need to replace.
//
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
  },
};
