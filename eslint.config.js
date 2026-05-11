import js from '@eslint/js';
import globals from 'globals';

const neutralinoGlobals = {
  Neutralino: 'readonly',
};

export default [
  {
    ignores: [
      'bin/**',
      'dist/**',
      'node_modules/**',
      'resources/js/neutralino.js',
      'resources/vendor/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...neutralinoGlobals,
      },
    },
  },
];
