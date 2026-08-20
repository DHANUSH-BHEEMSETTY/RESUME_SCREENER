/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        display: ['Syncopate', 'sans-serif'],
      },
      colors: {
        background: '#08080A',
        cyan: {
          400: '#7ff0e0',
          500: '#5eead4',
        },
        magenta: {
          400: '#d9a8ff',
          500: '#d8b4fe',
        }
      },
      animation: {
        'sheenspin': 'sheenspin 90s linear infinite',
        'sheenspin-reverse': 'sheenspin 140s linear infinite reverse',
      },
      keyframes: {
        sheenspin: {
          'to': { transform: 'rotate(1turn)' },
        }
      }
    },
  },
  plugins: [],
}
