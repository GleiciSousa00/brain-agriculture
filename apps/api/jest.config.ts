import type { Config } from 'jest';

/**
 * O limite de cobertura, e por que ele é este.
 *
 * A barra saiu da medição, arredondada para baixo até o inteiro imediatamente abaixo. Com
 * 228 testes sobre os 32 arquivos do recorte, a medição foi de 98,91% de instruções, 92,68%
 * de ramos, 98,98% de funções e 98,89% de linhas. Fixar no número exato reprovaria por uma
 * linha a mais de código, que não é queda de qualidade.
 *
 * A folga não é igual nas quatro. Instruções, funções e linhas ganham quase um ponto; ramos
 * ganham dois terços, porque a medição caiu perto do inteiro. **Ramos é o limite que trepida
 * primeiro**, e é o primeiro a olhar quando a pipeline reprovar aqui.
 *
 * O limite é barra contra queda, e não meta. Quem subir a cobertura sobe a barra junto,
 * senão ela para de significar o que significa hoje.
 */
const LIMITE_DE_COBERTURA = { statements: 98, branches: 92, functions: 98, lines: 98 };

/** Testes de unidade: rodam sem banco, sem Docker e sem subir aplicação. */
const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  /**
   * `scripts` entra junto de `src` porque a carga de volume decide o formato do conjunto
   * que vai para produção, e esse formato se prova sem banco. O que a pasta tem de banco
   * fica de fora por não casar com `.spec.ts`.
   */
  roots: ['<rootDir>/src', '<rootDir>/scripts'],
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
   * Duas exclusões dentro do recorte, pelo mesmo motivo: são arquivos sem comportamento a
   * provar, e mantê-los rebaixaria a barra sem que isso significasse qualidade menor.
   *
   * - Os `__fakes__` são código de teste. Substituto em memória tem cobertura alta por
   *   construção.
   * - As portas de repositório são interface mais um `Symbol` de injeção. O teste importa a
   *   interface com `import type`, que o compilador apaga, então a única linha executável
   *   nunca roda e o arquivo fica em zero. Eram sete arquivos, e sozinhos derrubavam a
   *   medida de instruções de 98,87% para 96,96%.
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
    '!src/**/*.repository.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',

  /**
   * O limite é global porque o recorte já aconteceu na coleta acima.
   *
   * A alternativa seria declará-lo por padrão de caminho, o que soaria mais fino, e não
   * funciona: no Jest, limite declarado por padrão vale arquivo a arquivo, e não sobre o
   * conjunto. Uma barra honesta com a medida do conjunto reprovaria na hora, porque há
   * arquivo legítimo bem abaixo dela: `propriedades/domain/propriedade.errors.ts` está em
   * 66,67% de funções, e `propriedade.ts` em 75% de ramos. Nenhum dos dois é descuido; são
   * arquivos pequenos, onde uma função a menos vale um terço da medida.
   *
   * Limite por diretório existente, esse sim agregado, exigiria uma entrada por módulo e
   * por camada, e um módulo novo escaparia do portão até alguém lembrar de acrescentá-lo.
   */
  coverageThreshold: { global: LIMITE_DE_COBERTURA },
};

export default config;
