/** @type {import("prettier").Config} */
const config = {
  endOfLine: 'lf',
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  plugins: ["prettier-plugin-packagejson"]
};

module.exports = config;