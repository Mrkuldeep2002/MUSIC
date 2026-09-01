/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#090a0f',
          800: '#12141d',
          700: '#1a1d2b',
          600: '#25293c',
          500: '#343a53',
        },
        brand: {
          purple: '#8b5cf6',
          pink: '#ec4899',
          cyan: '#06b6d4',
          emerald: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(139, 92, 246, 0.7)' },
        }
      }
    },
  },
  plugins: [],
}
