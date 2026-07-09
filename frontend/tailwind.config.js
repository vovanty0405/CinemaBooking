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
          red: '#E50914',
          'red-dark': '#B20710',
        },
        dark: {
          bg: '#141414',
          black: '#000000',
          surface: '#1F1F1F',
          input: '#2B2B2B',
        },
        accent: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          teal: '#14B8A6',
          gold: '#F5A623',
          pink: '#EC4899',
          orange: '#F97316',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B3B3B3',
          muted: '#6B6B6B',
          link: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'display': ['40px', { fontWeight: '700', lineHeight: '1.1' }],
        'h1': ['32px', { fontWeight: '700', lineHeight: '1.2' }],
        'h2': ['28px', { fontWeight: '600', lineHeight: '1.3' }],
        'h3': ['24px', { fontWeight: '600', lineHeight: '1.4' }],
        'body': ['16px', { fontWeight: '400', lineHeight: '1.6' }],
        'sm': ['14px', { fontWeight: '400', lineHeight: '1.5' }],
        'caption': ['12px', { fontWeight: '500', letterSpacing: '0.02em' }],
      },
      keyframes: {
        shrink: {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        }
      }
    },
  },
  plugins: [],
}
