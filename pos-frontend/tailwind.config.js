/* eslint-disable no-undef */
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
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
          foreground: 'var(--color-text-on-primary)',
          10: 'var(--color-primary-alpha-10)',
          20: 'var(--color-primary-alpha-20)',
          30: 'var(--color-primary-alpha-30)',
          50: 'var(--color-primary-alpha-50)',
        },
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}

