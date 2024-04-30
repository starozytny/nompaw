/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./assets/**/*.{js,jsx,ts,tsx}",
    "./templates/**/*.html.twig",
  ],
  theme: {
    extend: {
      screens: {
        'qhd': '1864px',
        '2qhd': '2500px',
      },
      spacing: {
        '6.5': '1.625rem',
        '8.5': '2.25rem'
      },
      colors: {
        'color0': '#1d2459',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

