import { DataSource, type QueryRunner } from 'typeorm';
import { comAplicacao, rodarComando } from './aplicacao';
import { contarLinhas } from './contagem';
import { criarProdutor, type Servidor } from './carregador-de-exemplo';
import {
  PRODUTORES_DE_VOLUME,
  planejarVolume,
  plantiosDoPlano,
  type PropriedadeDeVolume,
} from './dados-de-volume';
import { CULTURAS_INICIAIS } from '../src/modules/culturas/culturas.module';

/**
 * Enche o cadastro até cem mil Plantios, para a medição do painel valer alguma coisa.
 *
 * A carga entra em dois tempos. Os Produtores entram pela API, como na carga de exemplo,
 * porque é lá que o Documento é conferido e cifrado. As Propriedades e os Plantios entram
 * por SQL: cem mil requisições levariam dezenas de minutos e provariam a validação, que já
 * é provada em outro lugar.
 *
 * A carga cria os próprios Produtores em vez de revezar entre os que já estivessem na base.
 * Revezar parecia bastar, porque o painel não conta Produtor em lugar nenhum, e não bastou:
 * numa base com um Produtor só, o revezamento pendurava as mil Propriedades nele, e a
 * listagem do cadastro saía com o mesmo nome em toda linha.
 *
 * Quem decide o formato do conjunto é `dados-de-volume.ts`. Aqui só se grava.
 */

/** Quantos Plantios a issue 10 pede. A carga passa disto se a conta não fechar redonda. */
const PLANTIOS_ALVO = 100_000;

/**
 * Os dez ciclos da carga de volume.
 *
 * São dez porque é o que faz o recorte por Safra valer a pena: com uma Safra só, ou com
 * duas, filtrar por uma delas leva metade da tabela, e o Postgres varre a tabela inteira
 * de qualquer jeito. A dimensão que o índice serve precisa recortar de verdade.
 */
const ANOS_DE_VOLUME = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

rodarComando(async () => {
  await comAplicacao(async (app) => {
    const dataSource = app.get(DataSource);
    const antes = await contarLinhas(dataSource);

    if (antes.plantios !== undefined && antes.plantios >= PLANTIOS_ALVO) {
      console.log(
        `A base já tem ${antes.plantios.toLocaleString('pt-BR')} Plantios, que é o volume pedido. ` +
          'Para começar do zero, derrube a composição com `docker compose down --volumes`.',
      );
      return;
    }

    await garantirSafras(dataSource);

    const servidor = app.getHttpServer() as Servidor;
    const produtores: string[] = [];

    for (const produtor of PRODUTORES_DE_VOLUME) {
      produtores.push(await criarProdutor(servidor, produtor));
    }

    const propriedades = planejarVolume(
      produtores,
      { culturas: await quantasCulturas(dataSource), safras: ANOS_DE_VOLUME.length },
      PLANTIOS_ALVO,
    );

    await emConexaoSemTeto(dataSource, async (conexao) => {
      await inserirPropriedades(conexao, propriedades);
      await inserirPlantios(conexao, propriedades);

      await conexao.query('VACUUM ANALYZE');
    });

    const depois = await contarLinhas(dataSource);

    console.log(
      `Carga de volume: ${produtores.length} Produtores, ` +
        `${diferenca(antes, depois, 'propriedades')} Propriedades e ` +
        `${diferenca(antes, depois, 'plantios')} Plantios novos, em até ${ANOS_DE_VOLUME.length} ` +
        `Safras e ${CULTURAS_INICIAIS.length} Culturas por Propriedade. A base agora tem ` +
        `${depois.produtores} Produtores, ${depois.propriedades} Propriedades e ` +
        `${depois.plantios} Plantios. O plano previa ${plantiosDoPlano(propriedades)}.`,
    );
  });
});

/**
 * Grava as Propriedades já resolvidas, numa instrução.
 *
 * Os identificadores vêm prontos do plano, e não de `gen_random_uuid()`, porque a inserção
 * dos Plantios precisa saber qual Propriedade recebeu quantas Culturas. Sorteá-los no banco
 * devolveria uma lista de identificadores sem a coluna que diz de quem é cada um.
 */
async function inserirPropriedades(
  conexao: QueryRunner,
  propriedades: PropriedadeDeVolume[],
): Promise<void> {
  await conexao.query(
    `
      INSERT INTO propriedades (
        id, produtor_id, nome, cidade, estado, area_total, area_agricultavel, area_de_vegetacao
      )
      SELECT * FROM unnest(
        $1::uuid[], $2::uuid[], $3::text[], $4::text[], $5::text[],
        $6::numeric[], $7::numeric[], $8::numeric[]
      )
    `,
    [
      propriedades.map((uma) => uma.id),
      propriedades.map((uma) => uma.produtorId),
      propriedades.map((uma) => uma.nome),
      propriedades.map((uma) => uma.cidade),
      propriedades.map((uma) => uma.estado),
      propriedades.map((uma) => uma.areaTotal),
      propriedades.map((uma) => uma.areaAgricultavel),
      propriedades.map((uma) => uma.areaDeVegetacao),
    ],
  );
}

/**
 * Grava um Plantio para cada cruzamento de Propriedade com as Culturas e as Safras que ela
 * planta.
 *
 * As duas listas são numeradas antes do cruzamento, e cada Propriedade leva as primeiras.
 * A Cultura é numerada na ordem da carga inicial do catálogo, que vai da mais comum para a
 * menos comum, e a Safra na ordem do ano mais recente para o mais antigo. É esse corte que
 * faz a Soja aparecer em toda Propriedade e o Sorgo em poucas, em vez de todas as fatias
 * saírem do mesmo tamanho.
 *
 * Cultura acrescentada depois da carga inicial fica no fim da fila, porque o catálogo é
 * editável e não há ordem publicada para o que não veio nele.
 *
 * Como as Propriedades são novas, nenhum dos Plantios pode esbarrar na unicidade da trinca.
 */
async function inserirPlantios(
  conexao: QueryRunner,
  propriedades: PropriedadeDeVolume[],
): Promise<void> {
  await conexao.query(
    `
      WITH cultura AS (
        SELECT id, row_number() OVER (
          ORDER BY array_position($4::text[], nome::text) NULLS LAST, nome
        ) AS ordem
        FROM culturas
      ),
      safra AS (
        SELECT id, row_number() OVER (ORDER BY ano DESC) AS ordem
        FROM safras WHERE ano = ANY($5::int[])
      ),
      propriedade AS (
        SELECT * FROM unnest($1::uuid[], $2::int[], $3::int[]) AS t(id, culturas, safras)
      )
      INSERT INTO plantios (id, propriedade_id, cultura_id, safra_id)
      SELECT gen_random_uuid(), propriedade.id, cultura.id, safra.id
      FROM propriedade
      JOIN cultura ON cultura.ordem <= propriedade.culturas
      JOIN safra ON safra.ordem <= propriedade.safras
    `,
    [
      propriedades.map((uma) => uma.id),
      propriedades.map((uma) => uma.culturas),
      propriedades.map((uma) => uma.safras),
      [...CULTURAS_INICIAIS],
      ANOS_DE_VOLUME,
    ],
  );
}

/**
 * Empresta uma conexão só para a carga, com o tempo limite de consulta levantado.
 *
 * A aplicação corta em quinze segundos qualquer consulta, porque uma requisição que passa
 * disso já perdeu. Uma carga não é uma requisição: ela grava cem mil linhas e depois pede
 * um `VACUUM ANALYZE`, e as duas coisas podem levar mais que isso. O teto sai só nesta
 * conexão, e a das requisições continua como está.
 */
async function emConexaoSemTeto(
  dataSource: DataSource,
  usar: (conexao: QueryRunner) => Promise<void>,
): Promise<void> {
  const conexao = dataSource.createQueryRunner();
  await conexao.connect();

  try {
    await conexao.query('SET statement_timeout = 0');
    await usar(conexao);
  } finally {
    await conexao.release();
  }
}

/** As Safras da carga de volume, sem repetir as que a carga de exemplo já criou. */
async function garantirSafras(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    `
      INSERT INTO safras (id, ano)
      SELECT gen_random_uuid(), ano FROM unnest($1::int[]) AS ano
      ON CONFLICT (ano) DO NOTHING
    `,
    [ANOS_DE_VOLUME],
  );
}

/**
 * Quantas espécies o catálogo tem.
 *
 * Ela é o teto de quantas Culturas uma Propriedade pode plantar, então um catálogo vazio
 * daria uma carga sem Plantio nenhum. O catálogo vem semeado pela migração, e estar vazio
 * significa que as migrações não rodaram.
 */
async function quantasCulturas(dataSource: DataSource): Promise<number> {
  const [linha]: { total: string }[] = await dataSource.query(
    'SELECT count(*) AS total FROM culturas',
  );
  const total = Number(linha?.total ?? 0);

  if (total === 0) {
    throw new Error('O catálogo de Cultura está vazio, e sem ele não há o que plantar.');
  }

  return total;
}

function diferenca(
  antes: Record<string, number>,
  depois: Record<string, number>,
  tabela: string,
): string {
  return ((depois[tabela] ?? 0) - (antes[tabela] ?? 0)).toLocaleString('pt-BR');
}
