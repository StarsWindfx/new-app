/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#020202',
        surface: '#0d0d0d',
        'surface-2': '#141414',
        'surface-3': '#1a1a1a',
        violet: {
          DEFAULT: '#690B78',
          light: '#8B1099',
          dark: '#4A0856',
          glow: 'rgba(105,11,120,0.4)',
        },
        blue: {
          DEFAULT: '#26547C',
          light: '#3A7AB5',
          dark: '#1A3A57',
          glow: 'rgba(38,84,124,0.4)',
        },
        success: '#1A7A4A',
        warning: '#7A5A1A',
        error: '#7A1A1A',
        'success-light': '#22A55E',
        'warning-light': '#C49428',
        'error-light': '#C43C3C',
        text: {
          primary: '#F0F0F0',
          secondary: '#A0A0A0',
          muted: '#606060',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
