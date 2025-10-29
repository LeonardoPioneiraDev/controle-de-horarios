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
          DEFAULT: '#1a1a1a', // A dark black/charcoal
          50: '#f2f2f2',
          100: '#e6e6e6',
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#808080',
          500: '#4d4d4d',
          600: '#333333',
          700: '#1a1a1a',
          800: '#0d0d0d',
          900: '#000000',
        },
        accent: { // Using 'accent' for yellow to avoid confusion with 'secondary'
          DEFAULT: '#FFD700', // Gold/Vibrant Yellow
          50: '#fffbe6',
          100: '#fff7cc',
          200: '#fff099',
          300: '#ffe666',
          400: '#ffdb33',
          500: '#FFD700',
          600: '#e6c200',
          700: '#bf9f00',
          800: '#8c7300',
          900: '#594a00',
        },
        secondary: { // Keeping a neutral secondary for text/borders
          DEFAULT: '#6c757d',
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#000000',
        }
      }
    },
  },
  plugins: [],
}