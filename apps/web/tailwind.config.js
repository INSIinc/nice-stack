/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
      },
      backgroundColor: {
        layout: "var(--bg-layout)",
        mask: "var(--bg-mask)",
        container: "var(--bg-container)",
      },
      textColor: {
        default: "var(--color-text)",
        quaternary: "var(--color-text-quaternary)",
        placeholder: "var(--color-text-placeholder)",
        description: "var(--color-text-description)",
        secondary: "var(--color-text-secondary)",
        tertiary: "var(--color-text-tertiary)",
      },
      borderColor: {
        colorDefault: "var(--color-border)",
      }
    },
  },
  plugins: [],
}
