import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource, type Logger } from 'typeorm';
import { comAplicacao, rodarComando } from './aplicacao';
import { contarLinhas, type Contagem } from './contagem';
import type { Servidor } from './carregador-de-exemplo';

/**
 * Mede o plano de execução das consultas do painel contra a base carregada.
 *
 * A medição não escreve consulta nenhuma. Ela troca o registrador do TypeORM por um que
 * guarda o que passa, abre o painel duas vezes pela API, e depois manda o Postgres explicar
 * exatamente o SQL que a aplicação executou. É o que impede a medição de provar uma
 * consulta que o código não faz mais.
 *
 * Qual número cada consulta serve vem de duas coisas: em qual das duas aberturas ela
 * apareceu, e qual tabela ela lê. A abertura é o que separa a consulta recortada por Safra
 * da que cobre todas elas, e é sobre ela que o portão do índice se apoia.
 *
 * O relatório é versionado, para o README apontar para ele. O comando também é portão: se a
 * consulta recortada por Safra parar de usar o índice que o registro 0004 mandou criar, ele
 * falha.
 */

const RELATORIO = resolve(__dirname, '..', '..', '..', 'docs', 'medicoes', 'plano-do-painel.md');

/** O índice que existe por causa do recorte por Safra. Ver a migração do painel. */
const INDICE_DO_RECORTE = 'ix_plantios_safra_cultura';

/** Os cinco números que o painel busca, nomeados como o relatório os mostra. */
const ROTULO = {
  totais: 'Contagem de Propriedades, soma da Área Total e Uso do Solo',
  porEstado: 'Propriedades por estado',
  porCultura: 'Plantios por Cultura, todas as Safras',
  nomes: 'Nomes das Culturas, por chave primária',
  recorte: 'Plantios por Cultura, recortados por Safra',
};

interface Consulta {
  sql: string;
  parametros: unknown[];
}

interface Rotulada extends Consulta {
  rotulo: string;
}

interface Medida extends Rotulada {
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
  readonly consultas: Consulta[] = [];

  logQuery(sql: string, parametros?: unknown[]): void {
    this.consultas.push({ sql, parametros: parametros ?? [] });
  }

  logQueryError(): void {}
  logQuerySlow(): void {}
  logSchemaBuild(): void {}
  logMigration(): void {}
  log(): void {}
}

rodarComando(async () => {
  await comAplicacao(async (app) => {
    const dataSource = app.get(DataSource);
    const volume = await contarLinhas(dataSource);

    if ((volume.plantios ?? 0) === 0) {
      throw new Error(
        'A base não tem Plantio nenhum. Rode a carga de exemplo e a de volume antes.',
      );
    }

    const semFiltro = await capturar(app, dataSource);
    const comFiltro = await capturar(app, dataSource, await safraMaisCheia(dataSource));
    const medidas = await explicar(dataSource, [
      ...rotularAbertura(semFiltro),
      { ...consultaDePlantios(comFiltro), rotulo: ROTULO.recorte },
    ]);

    escrever(medidas, volume, await versaoDoPostgres(dataSource));
    conferirIndiceDoRecorte(medidas);

    console.log(`Medição escrita em ${RELATORIO}`);
    for (const medida of medidas) {
      console.log(`\n## ${medida.rotulo}\n${medida.plano}`);
    }
  });
});

/**
 * Abre o painel uma vez e devolve o SQL de cada consulta que ele fez.
 *
 * O registrador volta ao que era antes de a medição continuar: sem isso os próprios
 * `EXPLAIN` entrariam na lista, e o relatório mediria a si mesmo.
 */
async function capturar(
  app: INestApplication,
  dataSource: DataSource,
  safraId?: string,
): Promise<Consulta[]> {
  const capturador = new CapturadorDeSql();
  const anterior = dataSource.logger;
  dataSource.logger = capturador;

  try {
    const servidor = app.getHttpServer() as Servidor;
    const painel = request(servidor).get('/painel');

    await (safraId === undefined ? painel : painel.query({ safraId })).expect(200);
  } finally {
    dataSource.logger = anterior;
  }

  return capturador.consultas;
}

/**
 * Nomeia as quatro consultas de uma abertura sem filtro, pela tabela que cada uma lê.
 *
 * Se o painel deixar de fazer exatamente essas quatro, a medição para aqui em vez de
 * seguir com um rótulo errado. Um relatório que nomeia mal a consulta é pior do que
 * relatório nenhum: ele afirma o que não mediu.
 */
function rotularAbertura(consultas: Consulta[]): Rotulada[] {
  const rotuladas = consultas.map((consulta) => ({ ...consulta, rotulo: rotuloDe(consulta.sql) }));
  const esperados = [ROTULO.totais, ROTULO.porEstado, ROTULO.porCultura, ROTULO.nomes];
  const vistos = rotuladas.map((rotulada) => rotulada.rotulo);

  if ([...vistos].sort().join('|') !== [...esperados].sort().join('|')) {
    throw new Error(
      `O painel fez outras consultas do que a medição conhece. Vieram: ${vistos.join('; ')}.`,
    );
  }

  return rotuladas;
}

function rotuloDe(sql: string): string {
  if (sql.includes('"culturas"')) {
    return ROTULO.nomes;
  }

  if (sql.includes('"plantios"')) {
    return ROTULO.porCultura;
  }

  return sql.includes('GROUP BY') ? ROTULO.porEstado : ROTULO.totais;
}

/** Da abertura com filtro só interessa a consulta de Plantio: as outras repetem a anterior. */
function consultaDePlantios(consultas: Consulta[]): Consulta {
  const encontrada = consultas.find((consulta) => consulta.sql.includes('"plantios"'));

  if (encontrada === undefined) {
    throw new Error('O painel recortado por Safra não consultou Plantio. A medição não vale.');
  }

  return encontrada;
}

async function explicar(dataSource: DataSource, consultas: Rotulada[]): Promise<Medida[]> {
  const medidas: Medida[] = [];

  for (const consulta of consultas) {
    const linhas: Record<string, string>[] = await dataSource.query(
      `EXPLAIN (ANALYZE, BUFFERS) ${consulta.sql}`,
      consulta.parametros,
    );

    medidas.push({ ...consulta, plano: linhas.map((linha) => Object.values(linha)[0] ?? '').join('\n') });
  }

  return medidas;
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
function conferirIndiceDoRecorte(medidas: Medida[]): void {
  const recorte = medidas.find((medida) => medida.rotulo === ROTULO.recorte);

  if (recorte === undefined || !recorte.plano.includes(INDICE_DO_RECORTE)) {
    throw new Error(
      `A consulta recortada por Safra não usou ${INDICE_DO_RECORTE}. O plano foi:\n${recorte?.plano ?? 'nenhum'}`,
    );
  }
}

function escrever(medidas: Medida[], volume: Contagem, versao: string): void {
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
    ...Object.entries(volume).map(
      ([tabela, total]) => `| ${tabela} | ${total.toLocaleString('pt-BR')} |`,
    ),
    '',
    '## O que cada plano faz',
    '',
    '| Consulta | Leitura do plano | Tempo |',
    '| --- | --- | ---: |',
    ...medidas.map(
      (medida) => `| ${medida.rotulo} | ${leituraDo(medida.plano)} | ${tempoDe(medida.plano)} |`,
    ),
    '',
    'Uma agregação sem filtro lê a tabela inteira por definição, e o que o índice compra nesse',
    'caso é ler só o índice, que é mais estreito do que a tabela e dispensa tocá-la. O recorte',
    'por Safra é o único em que o índice também descarta linha, e por isso é o único que a',
    'medição cobra como portão.',
    '',
  ];

  for (const medida of medidas) {
    linhas.push(`## ${medida.rotulo}`, '', '```sql', medida.sql, '```', '', '```', medida.plano, '```', '');
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

/** A leitura do plano em uma linha, tirada do próprio plano e não de expectativa. */
function leituraDo(plano: string): string {
  const soIndice = /Index Only Scan using (\w+) on (\w+)/.exec(plano);

  if (soIndice !== null) {
    return `percorre só o índice \`${soIndice[1]}\`, sem tocar a tabela ${soIndice[2]}`;
  }

  const comIndice = /Index Scan using (\w+) on (\w+)/.exec(plano);

  if (comIndice !== null) {
    return `busca pelo índice \`${comIndice[1]}\` e lê a tabela ${comIndice[2]}`;
  }

  const varredura = /Seq Scan on (\w+)/.exec(plano);

  return varredura === null
    ? 'plano sem varredura reconhecida'
    : `varre a tabela ${varredura[1]} inteira`;
}

function tempoDe(plano: string): string {
  const tempo = /Execution Time: ([\d.]+) ms/.exec(plano);

  return tempo === null ? 'não informado' : `${tempo[1]} ms`;
}
