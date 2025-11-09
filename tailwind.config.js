// FILE: tailwind.config.js
// This is the fix. We are making the 'content' array more explicit
// to force Tailwind to scan all sub-directories inside 'pages'.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./pages/seller/**/*.{js,ts,jsx,tsx}", // Added this explicit path
    "./pages/management/**/*.{js,ts,jsx,tsx}", // Added this explicit path
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/forms"), // This is correct
  ],
};
