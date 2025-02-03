/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "postcss-import": {},
    "tailwindcss/nesting": {},
    autoprefixer: {},
    tailwindcss: {},
  },
};

export default config;
