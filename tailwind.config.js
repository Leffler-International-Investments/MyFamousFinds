/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // This is the most important part.
    // It tells Tailwind to scan all these files for classes.
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
