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
        // Your official Brand Electric Blue
        brand: {
          DEFAULT: 'oklch(50% 0.134 242.749)',
          foreground: 'oklch(98% 0.01 242.749)',
        },
        // Supporting glass tints
        glass: {
          white: 'rgba(255, 255, 255, 0.7)',
          border: 'rgba(255, 255, 255, 0.4)',
        }
      },
      backgroundImage: {
        // A subtle mesh gradient for your dashboard background
        'glass-mesh': "radial-gradient(at 0% 0%, oklch(95% 0.02 240) 0, transparent 50%), radial-gradient(at 100% 0%, oklch(92% 0.03 260) 0, transparent 50%)",
      },
      boxShadow: {
        // High-end glass depth shadows
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'brand-glow': '0 10px 25px -5px oklch(50% 0.134 242.749 / 0.4)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
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
