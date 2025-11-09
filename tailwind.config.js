/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // This tells Tailwind to scan all your pages and components
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
