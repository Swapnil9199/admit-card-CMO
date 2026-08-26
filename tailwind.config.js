/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36a8f6',
          500: '#0c8de6',
          600: '#016ec4',
          700: '#02589f',
          800: '#064b83',
          900: '#0a3f6d',
          950: '#072848',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        marathi: ['Noto Sans Devanagari', 'Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
