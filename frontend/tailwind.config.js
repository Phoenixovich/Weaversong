/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          start: '#FF7A18',
          end: '#A100FF',
        },
        background: {
          light: '#F7F7F7',
          warm: '#FAFAFF',
          soft: '#F0EFF5',
        },
      },
      transitionDuration: {
        'DEFAULT': '280ms',
        '280': '280ms',
      },
      transitionTimingFunction: {
        'DEFAULT': 'ease',
        'ease': 'ease',
      },
    },
  },
  plugins: [],
}

