/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#f2f9f8',
          100: '#e1f2f0',
          200: '#c5e6e2',
          300: '#9cd2cb',
          400: '#6bb6ad',
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#14413e',
        },
        card: {
          light: '#ffffff',
          border: '#e2e8f0',
          bg: '#e8f3f1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card-sm': '0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 4px -1px rgba(15, 23, 42, 0.03)',
        'card-md': '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 20px 30px -10px rgba(13, 148, 136, 0.12), 0 8px 12px -6px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}
