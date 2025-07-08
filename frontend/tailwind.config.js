/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#ffffff',
          'bg-secondary': '#f7f7f5',
          'bg-hover': '#f1f1ef',
          text: '#37352f',
          'text-secondary': '#787774',
          'text-tertiary': '#9b9a97',
          border: '#e9e9e7',
          'border-dark': '#d3d3d1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'page-title': '40px',
        'h1': '30px',
        'h2': '24px',
        'h3': '20px',
        'body': '16px',
        'small': '14px',
      },
      spacing: {
        'page': '96px',
        'block': '2px',
      },
    },
  },
  plugins: [],
}