/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'ping-pong': {
          '0%, 100%': { transform: 'translateX(-25%)' },
          '50%': { transform: 'translateX(125%)' },
        }
      },
      animation: {
        'ping-pong': 'ping-pong 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
