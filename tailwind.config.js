/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      colors: {
        ink:    { DEFAULT: '#0f0f0f', 50: '#f8f8f6', 100: '#eeede8', 200: '#d8d6cf', 300: '#b8b5ac', 400: '#898680', 500: '#6a6762', 600: '#4a4845', 700: '#353432', 800: '#1f1e1d', 900: '#0f0f0f' },
        accent: { DEFAULT: '#e85d26', 50: '#fff4ee', 100: '#ffe5d0', 200: '#ffc9a0', 300: '#ffa36b', 400: '#ff7a3b', 500: '#e85d26', 600: '#c4441a', 700: '#9e3414', 800: '#7a2810', 900: '#591d0c' },
        sage:   { DEFAULT: '#4a7c6a', 50: '#f0f5f3', 100: '#d8ebe5', 200: '#b0d6c9', 300: '#83bfae', 400: '#57a592', 500: '#4a7c6a', 600: '#3b6255', 700: '#2d4d43', 800: '#1f3630', 900: '#12211d' },
        sand:   { DEFAULT: '#f5f1ea', 100: '#faf8f4', 200: '#f5f1ea', 300: '#ebe4d5', 400: '#ddd5c2', 500: '#ccc0a8' },
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'fade-in':    'fadeIn 0.3s ease forwards',
        'slide-in-r': 'slideInRight 0.3s ease forwards',
      },
      keyframes: {
        fadeUp:       { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:       { from: { opacity: 0 }, to: { opacity: 1 } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};
