import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import { ignores } from './eslint.ignores.js';

export default tseslint.config(
  { ignores },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // ESLint 校验时也会直接放行包含显式 : any 定义的变量。
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
  ,
  {
    files: ['server/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  }
);
