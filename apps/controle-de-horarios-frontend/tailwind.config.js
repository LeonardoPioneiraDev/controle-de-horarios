/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'custom-md': '810px',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: '#111827', // A dark blue-gray for backgrounds
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        accent: { // Using 'accent' for yellow
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
      },
      backgroundImage: {
        'gradient-to-br-accent': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
      },
      gradientColorStops: theme => ({
        'accent-start': theme('colors.accent.400'),
        'accent-end': theme('colors.accent.600'),
      }),
    },
  },
  plugins: [],
}