import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource, type Logger } from 'typeorm';
import { comAplicacao, executar } from './aplicacao';

/**
 * Mede o plano de execução das consultas do painel contra a base carregada.
 *
 * A medição não conhece nenhuma consulta de cor. Ela troca o registrador do TypeORM por um
 * que guarda o que passa, abre o painel duas vezes pela API, e depois manda o Postgres
 * explicar exatamente o SQL que a aplicação executou. É o que impede a medição de provar
 * uma consulta que o código não faz mais.
 *
 * O resultado vira um arquivo versionado, para o README apontar para ele. Ele também é um
 * portão: se a consulta recortada por Safra parar de usar o índice que o registro 0004
 * mandou criar, o comando falha.
 */

const RELATORIO = resolve(__dirname, '..', '..', '..', 'docs', 'medicoes', 'plano-do-painel.md');

/** O índice que existe por causa do recorte por Safra. Ver a migração do painel. */
const INDICE_DO_RECORTE = 'ix_plantios_safra_cultura';

interface ConsultaCapturada {
  sql: string;
  parametros: unknown[];
}

interface ConsultaMedida extends ConsultaCapturada {
  rotulo: string;
  plano: string;
}

/**
 * Guarda o SQL que a aplicação executa.
 *
 * O TypeORM chama o registrador em toda consulta, e é o registrador que decide se imprime.
 * Trocá-lo é, portanto, a maneira de escutar sem mudar uma linha do código que vai para a
 * imagem.
 */
class CapturadorDeSql implements Logger {
  readonly consultas: ConsultaCapturada[] = [];

  logQuery(sql: string, parametros?: unknown[]): void {
    this.consultas.push({ sql, parametros: parametros ?? [] });
  }

  logQueryError(): void {}
  logQuerySlow(): void {}
  logSchemaBuild(): void {}
  logMigration(): void {}
  log(): void {}
}

executar(async () => {
  await comAplicacao(async (app) => {
    const dataSource = app.get(DataSource);
    const volume = await contarLinhas(dataSource);

    if (volume.plantios === 0) {
      throw new Error('A base não tem Plantio nenhum. Rode a carga de exemplo e a de volume antes.');
    }

    const capturadas = await capturar(app, dataSource, await safraMaisCheia(dataSource));
    const medidas = await explicar(dataSource, capturadas);

    escrever(medidas, volume, await versaoDoPostgres(dataSource));
    conferirIndiceDoRecorte(medidas);

    console.log(`Medição escrita em ${RELATORIO}`);
    for (const medida of medidas) {
      console.log(`\n## ${medida.rotulo}\n${medida.plano}`);
    }
  });
});

/**
 * Abre o painel duas vezes, sem filtro e com filtro, e devolve o SQL de cada consulta.
 *
 * O registrador volta ao que era antes de a medição continuar: sem isso os próprios
 * `EXPLAIN` entrariam na lista, e o relatório mediria a si mesmo.
 */
async function capturar(
  app: INestApplication,
  dataSource: DataSource,
  safraId: string,
): Promise<ConsultaCapturada[]> {
  const capturador = new CapturadorDeSql();
  const anterior = dataSource.logger;
  dataSource.logger = capturador;

  try {
    const servidor = app.getHttpServer() as Parameters<typeof request>[0];
    await request(servidor).get('/painel').expect(200);
    await request(servidor).get('/painel').query({ safraId }).expect(200);
  } finally {
    dataSource.logger = anterior;
  }

  return semRepetidas(capturador.consultas);
}

/** A mesma consulta aparece nas duas aberturas do painel. Medir duas vezes não diz nada. */
function semRepetidas(consultas: ConsultaCapturada[]): ConsultaCapturada[] {
  const vistas = new Map<string, ConsultaCapturada>();

  for (const consulta of consultas) {
    vistas.set(`${consulta.sql}|${JSON.stringify(consulta.parametros)}`, consulta);
  }

  return [...vistas.values()];
}

async function explicar(
  dataSource: DataSource,
  consultas: ConsultaCapturada[],
): Promise<ConsultaMedida[]> {
  const medidas: ConsultaMedida[] = [];

  for (const consulta of consultas) {
    const linhas: Record<string, string>[] = await dataSource.query(
      `EXPLAIN (ANALYZE, BUFFERS) ${consulta.sql}`,
      consulta.parametros,
    );

    medidas.push({
      ...consulta,
      rotulo: rotular(consulta),
      plano: linhas.map((linha) => Object.values(linha)[0] ?? '').join('\n'),
    });
  }

  return medidas;
}

/**
 * Diz qual número do painel cada consulta serve.
 *
 * O rótulo sai do próprio SQL, e não da ordem em que as consultas chegaram: três delas
 * partem juntas, e a ordem de chegada muda de execução para execução.
 */
function rotular({ sql, parametros }: ConsultaCapturada): string {
  if (sql.includes('"culturas"')) {
    return 'Nomes das Culturas, por chave primária';
  }

  if (sql.includes('"plantios"')) {
    return parametros.length > 0
      ? 'Plantios por Cultura, recortados por Safra'
      : 'Plantios por Cultura, todas as Safras';
  }

  if (sql.includes('GROUP BY')) {
    return 'Propriedades por estado';
  }

  return 'Contagem de Propriedades, soma da Área Total e Uso do Solo';
}

/** O recorte mais pesado que existe, que é o que vale a pena medir. */
async function safraMaisCheia(dataSource: DataSource): Promise<string> {
  const [linha]: { id: string }[] = await dataSource.query(
    `SELECT safra_id AS id FROM plantios GROUP BY safra_id ORDER BY count(*) DESC LIMIT 1`,
  );

  if (linha === undefined) {
    throw new Error('Nenhuma Safra tem Plantio, e sem isso não há recorte para medir.');
  }

  return linha.id;
}

async function contarLinhas(dataSource: DataSource): Promise<Record<string, number>> {
  const [linha]: Record<string, string>[] = await dataSource.query(
    `SELECT
       (SELECT count(*) FROM produtores) AS produtores,
       (SELECT count(*) FROM propriedades) AS propriedades,
       (SELECT count(*) FROM culturas) AS culturas,
       (SELECT count(*) FROM safras) AS safras,
       (SELECT count(*) FROM plantios) AS plantios`,
  );

  return Object.fromEntries(
    Object.entries(linha ?? {}).map(([tabela, total]) => [tabela, Number(total)]),
  );
}

async function versaoDoPostgres(dataSource: DataSource): Promise<string> {
  const [linha]: { version: string }[] = await dataSource.query('SELECT version()');

  return linha?.version ?? 'desconhecida';
}

/**
 * O portão da medição.
 *
 * O índice `ix_plantios_safra_cultura` existe por uma consulta só, a do recorte por Safra.
 * Um plano que deixe de usá-lo é ou um índice que morreu, ou uma consulta que mudou de
 * forma, e as duas coisas precisam ser vistas na hora, não meses depois.
 */
function conferirIndiceDoRecorte(medidas: ConsultaMedida[]): void {
  const recorte = medidas.find((medida) => medida.rotulo.includes('recortados por Safra'));

  if (recorte === undefined) {
    throw new Error('O painel não fez nenhuma consulta recortada por Safra. A medição não vale.');
  }

  if (!recorte.plano.includes(INDICE_DO_RECORTE)) {
    throw new Error(
      `A consulta recortada por Safra não usou ${INDICE_DO_RECORTE}. O plano foi:\n${recorte.plano}`,
    );
  }
}

function escrever(
  medidas: ConsultaMedida[],
  volume: Record<string, number>,
  versao: string,
): void {
  const linhas = [
    '# Plano de execução das consultas do painel',
    '',
    'Arquivo gerado por `pnpm medir:painel`, que abre o painel pela API, captura o SQL que a',
    'aplicação executou e pede ao Postgres que o explique. Não editar à mão.',
    '',
    `Medição de ${new Date().toISOString().slice(0, 10)}, contra \`${versao.split(' on ')[0]}\`.`,
    `Origem: ${origemDaMedicao()}.`,
    '',
    '## Volume medido',
    '',
    '| Tabela | Linhas |',
    '| --- | ---: |',
    ...Object.entries(volume).map(([tabela, total]) => `| ${tabela} | ${total.toLocaleString('pt-BR')} |`),
    '',
    '## Resumo',
    '',
    '| Consulta | Índices no plano |',
    '| --- | --- |',
    ...medidas.map((medida) => `| ${medida.rotulo} | ${indicesDoPlano(medida.plano)} |`),
    '',
  ];

  for (const medida of medidas) {
    linhas.push(
      `## ${medida.rotulo}`,
      '',
      '```sql',
      medida.sql,
      '```',
      '',
      '```',
      medida.plano,
      '```',
      '',
    );
  }

  mkdirSync(dirname(RELATORIO), { recursive: true });
  writeFileSync(RELATORIO, `${linhas.join('\n')}\n`, 'utf8');
}

/**
 * De onde saiu esta medição.
 *
 * Vale para quem lê o relatório meses depois: uma medição sem máquina e sem execução é uma
 * afirmação, e a issue 10 pede o contrário disso.
 */
function origemDaMedicao(): string {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;

  if (GITHUB_RUN_ID === undefined) {
    return 'execução local';
  }

  return `pipeline, ${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
}

/** Os índices citados no plano, que é a leitura que a issue 10 cobra por escrito. */
function indicesDoPlano(plano: string): string {
  const citados = [...new Set(plano.match(/\bix_[a-z_]+/g) ?? [])];

  return citados.length === 0 ? 'nenhum, varredura sequencial' : citados.join(', ');
}
