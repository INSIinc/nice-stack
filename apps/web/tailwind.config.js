/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        primaryActive: "var(--color-primary-active)",
        primaryHover: "var(--color-primary-hover)",
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        info: "var(--color-info)",
        success: "var(--color-success)",
        link: "var(--color-link)",
        highlight: "var(--color-highlight)",
      },
      backgroundColor: {
        layout: "var(--color-bg-layout)",
        mask: "var(--color-bg-mask)",
        container: "var(--color-bg-container)",
        textHover: "var(--color-bg-text-hover)",
        primary: "var(--color-bg-primary)",
        error: "var(--color-error-bg)",
        warning: "var(--color-warning-bg)",
        info: "var(--color-info-bg)",
        success: "var(--color-success-bg)",
      },
      textColor: {
        default: "var(--color-text)",
        quaternary: "var(--color-text-quaternary)",
        placeholder: "var(--color-text-placeholder)",
        description: "var(--color-text-description)",
        secondary: "var(--color-text-secondary)",
        tertiary: "var(--color-text-tertiary)",
        primary: "var(--color-text-primary)",
        heading: "var(--color-text-heading)",
        label: "var(--color-text-label)",
        lightSolid: "var(--color-text-lightsolid)"
      },
      borderColor: {
        default: "var(--color-border)",
      },
      boxShadow: {
        elegant: '0 3px 6px -2px rgba(46, 117, 182, 0.10), 0 2px 4px -1px rgba(46, 117, 182, 0.05)'

      }
    },
  },
  plugins: [],
}
