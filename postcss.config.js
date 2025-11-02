// FILE: postcss.config.js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }


---


// FILE: tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
theme: { extend: {} },
plugins: []
}
