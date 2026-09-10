import type { Config } from 'jest';

/**
 * O limite de cobertura, e por que ele é este.
 *
 * A barra foi fixada medindo a cobertura de hoje e arredondando para baixo, para o inteiro
 * imediatamente abaixo de cada medição. A medição, com 221 testes sobre 38 arquivos, foi de
 * 96,96% de instruções, 92,50% de ramos, 98,92% de funções e 96,93% de linhas. Fixar no
 * número exato reprovaria por uma linha a mais de código, que não é queda de qualidade; o
 * arredondamento dá a folga de uma casa e nada além disso.
 *
 * O limite é uma barra contra queda, e não uma meta. Quem subir a cobertura sobe a barra
 * junto, senão ela para de significar o que significa hoje.
 */
const LIMITE = { statements: 96, branches: 92, functions: 98, lines: 96 };

/** Testes de unidade: rodam sem banco, sem Docker e sem subir aplicação. */
const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testRegex: String.raw`\.spec\.ts$`,
  transform: {
    [String.raw`^.+\.ts$`]: ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],

  /**
   * A cobertura é coletada só onde existe limite: `domain` e `application`, dos módulos e
   * de `shared`. A issue 2 diz por quê: cobertura de tradutor e de controller mede pouco,
   * porque eles quase não têm decisão, e exigi-la premia teste que só passa por linha.
   *
   * Coletar só o que se exige tem uma consequência, e ela é deliberada: o relatório deixa
   * de mostrar número de `infrastructure` e de `http`. Como não há limite nessas camadas, o
   * número delas não decidia nada.
   *
   * Os `__fakes__` ficam de fora porque são código de teste. Um substituto em memória tem
   * cobertura alta por construção, e deixá-lo dentro inflaria a medida sem provar nada.
   *
   * O recorte casa por padrão de caminho, e não por lista de módulos. Módulo novo entra no
   * limite sozinho, que é o contrário de escapar dele por esquecimento.
   */
  collectCoverageFrom: [
    'src/modules/*/domain/**/*.ts',
    'src/modules/*/application/**/*.ts',
    'src/shared/domain/**/*.ts',
    'src/shared/application/**/*.ts',
    '!src/**/__fakes__/**',
  ],
  coverageDirectory: '<rootDir>/coverage',

  // O limite é global porque o recorte já foi feito na coleta acima. Limite por padrão de
  // caminho, no Jest, vale arquivo a arquivo, e reprovaria as portas de repositório, que
  // são interface mais um `Symbol` e ficam em zero por não terem o que executar.
  coverageThreshold: { global: LIMITE },
};

export default config;
