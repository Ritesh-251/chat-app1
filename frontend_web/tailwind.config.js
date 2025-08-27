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
          green: '#2E7D32',
          'green-light': '#66BB6A',
          'green-lighter': '#A5D6A7',
          'green-dark': '#1B5E20',
          'green-medium': '#81C784'
        }
      },
      borderRadius: {
        'brand': '14px'
      }
    },
  },
  plugins: [],
}
