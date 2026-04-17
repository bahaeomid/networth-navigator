import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '_dev/docs/**',
      '_dev/skills/**',
      'playwright-report/**',
      'test-results/**',
      'test-output.txt',
      '_dev/tests/**',
    ],
  },
  {
    files: ['src/**/*.{js,jsx}', '_dev/e2e/**/*.js', 'vite.config.js', 'playwright.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
    },
  },
];