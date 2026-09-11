/**
 * Versão executável da regra de dependência do registro de decisão 0005.
 *
 * A tabela em `docs/adr/0005-camadas-isoladas-por-regra-de-dependencia.md` é a versão
 * legível. Divergência entre as duas é defeito, e quem vale é este arquivo.
 */

/** As quatro camadas valem tanto dentro de um módulo quanto dentro de `shared`. */
const DENTRO_DE = '^apps/api/src/(modules/[^/]+|shared)';

const LAYER = {
  domain: `${DENTRO_DE}/domain/`,
  application: `${DENTRO_DE}/application/`,
  infrastructure: `${DENTRO_DE}/infrastructure/`,
  http: `${DENTRO_DE}/http/`,
};

/** Bibliotecas proibidas nas duas camadas de dentro: elas são TypeScript puro. */
const OUTSIDE_LIBRARIES = 'node_modules/(@nestjs/|typeorm/|pg/|zod/|nestjs-zod/)';

module.exports = {
  forbidden: [
    {
      name: 'domain-nao-olha-para-fora',
      severity: 'error',
      comment: '`domain` só importa `domain`. Ele não sabe que existe caso de uso, banco ou HTTP.',
      from: { path: LAYER.domain },
      to: { path: `${DENTRO_DE}/(application|infrastructure|http)/` },
    },
    {
      name: 'domain-sem-framework',
      severity: 'error',
      comment: '`domain` é TypeScript puro: sem framework, sem ORM, sem biblioteca de validação.',
      from: { path: LAYER.domain },
      to: {
        dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer'],
        path: OUTSIDE_LIBRARIES,
      },
    },
    {
      name: 'application-nao-olha-para-fora',
      severity: 'error',
      comment: '`application` recebe portas. Ela não sabe que existe banco nem que existe HTTP.',
      from: { path: LAYER.application },
      to: { path: `${DENTRO_DE}/(infrastructure|http)/` },
    },
    {
      name: 'application-sem-framework',
      severity: 'error',
      comment: 'Sem `@nestjs/*` na `application`: é a única propriedade que a torna portátil.',
      from: { path: LAYER.application },
      to: {
        dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer'],
        path: OUTSIDE_LIBRARIES,
      },
    },
    {
      name: 'infrastructure-nao-importa-http',
      severity: 'error',
      comment: '`infrastructure` é a porta de saída. Ela nunca depende da porta de entrada.',
      from: { path: LAYER.infrastructure },
      to: { path: LAYER.http },
    },
    {
      name: 'http-nao-importa-infrastructure',
      severity: 'error',
      comment: '`http` fala com casos de uso, nunca com repositório concreto.',
      from: { path: LAYER.http },
      to: { path: LAYER.infrastructure },
    },
    {
      name: 'entre-modulos-so-domain',
      severity: 'error',
      comment: 'Um módulo nunca importa `application`, `infrastructure` ou `http` de outro módulo.',
      from: { path: '^apps/api/src/modules/([^/]+)/' },
      to: {
        path: '^apps/api/src/modules/[^/]+/(application|infrastructure|http)/',
        pathNot: '^apps/api/src/modules/$1/',
      },
    },
    {
      name: 'so-o-modulo-enxerga-as-proprias-camadas',
      severity: 'error',
      comment:
        'De fora, um módulo se apresenta pelo arquivo de módulo. As quatro camadas são internas a ele. A regra vale para o código que vai para a imagem, e teste não vai: `apps/api/test` e os `.spec` de `src` ficam de fora dela de propósito, porque teste alcança o que precisa afirmar.',
      from: { path: '^apps/api/src/', pathNot: ['^apps/api/src/modules/', '\\.spec\\.ts$'] },
      to: { path: '^apps/api/src/modules/[^/]+/(domain|application|infrastructure|http)/' },
    },
    {
      name: 'comando-so-enxerga-o-arquivo-de-modulo',
      severity: 'error',
      comment:
        'Os comandos de `apps/api/scripts` não vão para a imagem, mas continuam falando com os módulos pela face que eles mostram: o arquivo de módulo e o que ele publica. Sem esta regra a pasta seria um caminho de fora da regra de dependência.',
      from: { path: '^apps/api/scripts/' },
      to: { path: '^apps/api/src/modules/[^/]+/(domain|application|infrastructure|http)/' },
    },
    {
      name: 'shared-nao-conhece-modulo',
      severity: 'error',
      comment: '`shared` é usado pelos módulos e não conhece nenhum deles. A seta aponta num sentido só.',
      from: { path: '^apps/api/src/shared/' },
      to: { path: '^apps/api/src/modules/' },
    },
    {
      name: 'web-nao-importa-api',
      severity: 'error',
      comment: 'A interface web consome o pacote de contratos, nunca o código da API.',
      from: { path: '^apps/web/' },
      to: { path: '^apps/api/' },
    },
    {
      name: 'sem-ciclo',
      severity: 'error',
      comment: 'Ciclo de dependência.',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(dist|coverage|[.]turbo)/' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
