import js from '@eslint/js';
import globals from 'globals';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

/**
 * Portão de simplicidade: a complexidade cognitiva de uma função não passa de quinze.
 * O limite é a medida determinística de simplicidade exigida pela pipeline.
 */
const COGNITIVE_COMPLEXITY_LIMIT = 15;

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      // Ferramental local, fora do versionamento, em pastas ocultas.
      '**/.*/**',
      // Cliente gerado a partir da especificação OpenAPI: editar aqui não adianta.
      'packages/contracts/src/generated/**',
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
      'sonarjs/cognitive-complexity': ['error', COGNITIVE_COMPLEXITY_LIMIT],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Quem pede identificador no caminho usa o pipe que recusa em português. O do Nest
    // recusa em inglês, e a interface mostra o `detail` da API sem reescrita: uma rota
    // esquecida põe texto de biblioteca na tela. O próprio pipe é quem o estende.
    files: ['apps/api/src/**/*.controller.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nestjs/common',
              importNames: ['ParseUUIDPipe'],
              message: 'Use o IdentificadorPipe, de shared/http/identificador.pipe.',
            },
          ],
        },
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
