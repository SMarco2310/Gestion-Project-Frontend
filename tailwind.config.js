import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Allow manual dark mode toggling using a 'dark' class
  theme: {
    extend: {
      colors: {
        primary: '#0891b2',
        main: '#0B0E11',
        secondary: '#5B6168',
        'form-placeholder': '#A1A5A9',
        'form-border': '#E6EAEC',
        card: '#FFFFFF',
        canvas: '#F7F9FA',
        'shadow-color': '#EDF1F3',
      },
    },
  },
  plugins: [
    typography,
  ]
}