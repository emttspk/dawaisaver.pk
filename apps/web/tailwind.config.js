/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8"
        },
        medical: {
          50: "#f0fdfa",
          100: "#ccfee7",
          200: "#99f6da",
          300: "#51e3b4",
          400: "#2ddab3",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#0a5f54",
          900: "#083f42"
        },
        healthcare: {
          50: "#f0fdf9",
          100: "#ccfcee",
          200: "#99f6dc",
          300: "#51e3b8",
          400: "#2ddab8",
          500: "#14b8a0",
          600: "#0d9482",
          700: "#0f7666",
          800: "#0a5f52",
          900: "#083f40"
        }
      }
    },
  },
  plugins: [],
};