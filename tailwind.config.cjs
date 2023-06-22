/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './*.html'],
  darkMode: 'media',
  mode: 'jit',
  theme: {
    extend: {
      boxShadow: {
        focmyus: '0 0 0 0 rgba(#5a99d4, 1)',
      },
      keyframes: {
        shake: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          // '100%': { transform: 'scale(1)' },
        },
        focus: {
          '0%, 100%': { transform: 'translateY(-5%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0%)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        },
      },
      animation: {
        shake: 'shake 150ms ease-in-out',
        focus: 'focus 1s infinite',
      },
    },
  },
};
