module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      // React Router route modules intentionally export metadata and loaders
      // beside their components, so the Fast Refresh heuristic does not apply.
      files: ['src/root.tsx', 'src/pages/**/*.tsx'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
  ],
}
