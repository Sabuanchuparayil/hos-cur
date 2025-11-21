/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /theme-.+/,
    },
    {
      pattern: /bg-.+/,
    },
    {
      pattern: /text-.+/,
    },
    {
      pattern: /border-.+/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
