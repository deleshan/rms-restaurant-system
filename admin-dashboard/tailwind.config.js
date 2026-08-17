/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'oklch(50% 0.134 242.749)',
          foreground: 'oklch(98% 0.01 242.749)',
        },
        lightBrand: 'oklch(74.6% 0.16 232.661)',
        glass: {
          white: 'rgba(255, 255, 255, 0.7)',
          border: 'rgba(255, 255, 255, 0.4)',
          dark: 'rgba(15, 23, 42, 0.6)',
        }
      },
      backgroundImage: {
        'glass-mesh': "radial-gradient(at 0% 0%, oklch(92% 0.04 140) 0, transparent 80%), radial-gradient(at 100% 0%, oklch(88% 0.06 155) 0, transparent 80%)",
        'dark-mesh': "radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.15) 0, transparent 60%), radial-gradient(at 100% 100%, rgba(5, 150, 105, 0.1) 0, transparent 60%)",
      },
      
      transitionTimingFunction: {
        'custom-ease': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'extra-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
       
        'brand-glow': '0 10px 25px -5px rgba(var(--brand), 0.4)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}