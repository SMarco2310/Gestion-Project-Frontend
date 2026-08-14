import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Allow manual dark mode toggling using a 'dark' class
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          hover: 'var(--color-primary-hover)',
          subtle: 'var(--color-primary-subtle)',
        },
        main: '#0B0E11',
        secondary: '#5B6168',
        'form-placeholder': '#A1A5A9',
        'form-border': '#E6EAEC',
        card: '#FFFFFF',
        canvas: '#F7F9FA',
        'shadow-color': '#EDF1F3',
        // Consolidated dark-mode surfaces — named after the most-used hex
        // values already in the codebase, so this is a semantic label for
        // the existing dominant palette rather than a new repaint.
        'dark-canvas': '#151515',   // page background, sunken wells
        'dark-card': '#1D1D1D',     // default card/panel surface
        'dark-card-alt': '#1A1A1D', // secondary panel surface (sidebar, modals)
        'dark-elevated': '#222224', // hover/elevated state, popovers
      },
      borderRadius: {
        control: '0.5rem',  // 8px  — inputs, badges, small chips
        panel: '0.75rem',   // 12px — cards, buttons
        surface: '1.25rem', // 20px — modals, large panels
      },
    },
  },
  plugins: [
    typography,
  ]
}