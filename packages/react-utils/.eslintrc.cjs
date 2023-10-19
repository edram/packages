/** @type {import("eslint").Linter.Config} */
const config = {
  extends: ['edram/prettier'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
};

module.exports = config;
