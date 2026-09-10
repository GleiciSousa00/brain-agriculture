/**
 * Versão executável da regra de dependência do registro de decisão 0005.
 *
 * A tabela em `docs/adr/0005-camadas-isoladas-por-regra-de-dependencia.md` é a versão
 * legível. Divergência entre as duas é defeito, e quem vale é este arquivo.
 */

const CAMADA = {
  dominio: '^apps/api/src/(modules/[^/]+|shared)/domain/',
  aplicacao: '^apps/api/src/(modules/[^/]+|shared)/application/',
  infraestrutura: '^apps/api/src/modules/[^/]+/infrastructure/',
  http: '^apps/api/src/modules/[^/]+/http/',
};

/** Bibliotecas proibidas nas duas camadas de dentro: elas são TypeScript puro. */
const BIBLIOTECAS_DE_FORA = 'node_modules/(@nestjs/|typeorm/|pg/|zod/|nestjs-zod/)';

module.exports = {
  forbidden: [
    {
      name: 'domain-nao-olha-para-fora',
      severity: 'error',
      comment: '`domain` só importa `domain`. Ele não sabe que existe caso de uso, banco ou HTTP.',
      from: { path: CAMADA.dominio },
      to: { path: '^apps/api/src/(modules/[^/]+|shared)/(application|infrastructure|http)/' },
    },
    {
      name: 'domain-sem-framework',
      severity: 'error',
      comment: '`domain` é TypeScript puro: sem framework, sem ORM, sem biblioteca de validação.',
      from: { path: CAMADA.dominio },
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer'], path: BIBLIOTECAS_DE_FORA },
    },
    {
      name: 'application-nao-olha-para-fora',
      severity: 'error',
      comment: '`application` recebe portas. Ela não sabe que existe banco nem que existe HTTP.',
      from: { path: CAMADA.aplicacao },
      to: { path: '^apps/api/src/modules/[^/]+/(infrastructure|http)/' },
    },
    {
      name: 'application-sem-framework',
      severity: 'error',
      comment: 'Sem `@nestjs/*` na `application`: é a única propriedade que a torna portátil.',
      from: { path: CAMADA.aplicacao },
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer'], path: BIBLIOTECAS_DE_FORA },
    },
    {
      name: 'infrastructure-nao-importa-http',
      severity: 'error',
      comment: '`infrastructure` é a porta de saída. Ela nunca depende da porta de entrada.',
      from: { path: CAMADA.infraestrutura },
      to: { path: '^apps/api/src/modules/[^/]+/http/' },
    },
    {
      name: 'http-nao-importa-infrastructure',
      severity: 'error',
      comment: '`http` fala com casos de uso, nunca com repositório concreto.',
      from: { path: CAMADA.http },
      to: { path: '^apps/api/src/modules/[^/]+/infrastructure/' },
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
