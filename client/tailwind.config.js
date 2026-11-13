/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fb',
          100: '#dce6f5',
          600: '#1a3a6b',
          700: '#142e57',
          800: '#0F2044',
          900: '#0a1630',
        },
        amber: {
          400: '#e8b94a',
          500: '#D4A017',
          600: '#b88a12',
        }
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
