module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json', 
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Custom rules to match your preference (optional)
    '@typescript-eslint/no-explicit-any': 'off', // Allows 'any' type (useful for legacy code)
    '@typescript-eslint/no-var-requires': 'off', // Allows require() (useful for Webpack configs)

    '@typescript-eslint/semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    '@typescript-eslint/strict-boolean-expressions': 'warn',
  },
};