/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/**/*.html',
    './public/js/**/*.js',
    './src/styles/**/*.css',
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        matrix: {
          navy: '#102747',
          red: '#c62828',
          gold: '#c49a58',
          paper: '#f7f8fa',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
