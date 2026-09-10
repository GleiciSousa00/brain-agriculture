import js from '@eslint/js';
import globals from 'globals';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

/**
 * Portão de simplicidade: a complexidade cognitiva de uma função não passa de quinze.
 * O limite é a medida determinística de simplicidade exigida pela pipeline.
 */
const LIMITE_DE_COMPLEXIDADE_COGNITIVA = 15;

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      // Ferramental local, fora do versionamento, em pastas ocultas.
      '**/.*/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.turbo/**',
      'apps/web/dist/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    plugins: { sonarjs },
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'sonarjs/cognitive-complexity': ['error', LIMITE_DE_COMPLEXIDADE_COGNITIVA],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.int-spec.ts'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
);
