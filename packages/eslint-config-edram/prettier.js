/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [require.resolve('./index'), 'plugin:prettier/recommended'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
};
