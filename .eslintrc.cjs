/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Allow catch(error: any)
    '@typescript-eslint/no-explicit-any': 'off',

    // Allow apostrophes & quotes in JSX text
    'react/no-unescaped-entities': 'off',

    // Allow unused vars (useful in forms & drafts)
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
};
