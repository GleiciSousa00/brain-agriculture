import type { Config } from 'jest';

/**
 * Testes de integração: o trabalho lento da pipeline. Sobem dependência de verdade,
 * então rodam separados dos testes de unidade e com folga de tempo.
 */
const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  setupFiles: ['<rootDir>/test/setup.ts'],
  testRegex: String.raw`\.int-spec\.ts$`,
  transform: {
    [String.raw`^.+\.ts$`]: ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 120_000,
};

export default config;
