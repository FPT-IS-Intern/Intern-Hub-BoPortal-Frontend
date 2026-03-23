import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const aliasImportMessage =
  'Use path aliases (`@/...` or `@env/...`) instead of deep relative imports.';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.angular/**',
      'coverage/**',
      'out-tsc/**',
      'src/**/*.spec.ts',
      'public/**',
    ],
  },
  {
    files: ['src/app/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
        crypto: 'readonly',
        atob: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-duplicate-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: String.raw`^(\.\.\/)+(components|core|services|models|i18n|layouts|features|directives)\/`,
              message: aliasImportMessage,
            },
            {
              regex: String.raw`^(\.\.\/)+environments\/`,
              message: aliasImportMessage,
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/app/models/**/*.ts',
      'src/app/services/api/**/*.ts',
      'src/app/core/config/**/*.ts',
      'src/app/features/login/**/*.ts',
    ],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
