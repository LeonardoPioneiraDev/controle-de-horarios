/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          500: '#667eea',
          600: '#5a6fd8',
          700: '#4c63d2',
        },
        secondary: {
          500: '#6c757d',
          600: '#5a6268',
        }
      }
    },
  },
  plugins: [],
}