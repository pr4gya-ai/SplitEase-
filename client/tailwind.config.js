/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#101B33', soft: '#4A5775', faint: '#7C88A5' },
        paper: { DEFAULT: '#F3F5F9', deep: '#E6EBF3' },
        rule: '#C9D6EA',
        saffron: { DEFAULT: '#FF9F1C', dark: '#E08600', tint: '#FFF1DB' },
        owe: '#B42342',
        owed: '#12724A',
      },
      fontFamily: { sans: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      keyframes: {
        'slip-in': {
          '0%': { opacity: '0', transform: 'translateY(-14px) rotate(-1.2deg)' },
          '100%': { opacity: '1', transform: 'none' },
        },
      },
      animation: { 'slip-in': 'slip-in 420ms cubic-bezier(.2,.8,.2,1) both' },
    },
  },
  plugins: [],
};
