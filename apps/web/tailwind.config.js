/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ECFEFF',
        card: '#FFFFFF',
        'text-primary': '#164E63',
        accent: {
          cyan: '#0891B2',
          mint: '#22D3EE',
          green: '#22C55E',
        },
      },
      borderRadius: {
        lg: '16px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
