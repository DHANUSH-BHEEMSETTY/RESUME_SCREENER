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
        base: '#07080a',
        surface: '#0d0f12',
        'surface-2': '#111318',
        border: '#1a1e26',
        'border-light': '#252b36',
        cyan: {
          DEFAULT: '#00f5d4',
          400: '#5eead4',
          500: '#00f5d4',
          glow: 'rgba(0,245,212,0.15)',
        },
        magenta: {
          DEFAULT: '#c084fc',
          400: '#c084fc',
          500: '#a855f7',
        }
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'slide-up': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
