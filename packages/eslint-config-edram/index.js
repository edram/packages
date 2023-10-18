/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',

    // 'plugin:jsx-a11y/recommended',

    // react
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/react',
    require.resolve('./rules/react'),
    require.resolve('./rules/typescript'),
  ],
  env: {
    browser: true,
    node: true,
  },
};
