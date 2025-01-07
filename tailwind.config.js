/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#475569",
        accent: "#22c55e",
        error: "#ef4444",
      },
    },
  },
  plugins: [],
}
