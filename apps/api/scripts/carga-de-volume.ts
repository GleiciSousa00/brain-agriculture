import { DataSource } from 'typeorm';
import { comAplicacao, executar } from './aplicacao';
import { UNIDADES_FEDERATIVAS } from '../src/modules/propriedades/domain/propriedade';

/**
 * Enche o cadastro até cem mil Plantios, para a medição do painel valer alguma coisa.
 *
 * Esta carga entra por SQL, e não pela API como a de exemplo. Cem mil requisições levariam
 * dezenas de minutos e provariam a validação, que já é provada em outro lugar. O que se
 * quer aqui é volume no banco, e volume no banco se faz com uma instrução.
 *
 * As Propriedades novas pendem dos Produtores que já existem, revezando entre eles. O
 * painel não conta Produtor em lugar nenhum, então multiplicá-los não mudaria número
 * nenhum da medição.
 *
 * A lista de siglas vem do domínio de Propriedade em vez de ser copiada para cá. Este
 * arquivo não vai para a imagem, e a regra de dependência do registro 0005 fala do código
 * que vai; duas listas de unidades federativas, por outro lado, divergiriam.
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

interface Contagem {
  propriedades: number;
  plantios: number;
}

executar(async () => {
  await comAplicacao(async (app) => {
    const dataSource = app.get(DataSource);

    await garantirSafras(dataSource);

    const produtores = await identificadoresDeProdutor(dataSource);
    const culturas = await quantasCulturas(dataSource);
    const antes = await contar(dataSource);
    const propriedadesNovas = Math.ceil(PLANTIOS_ALVO / (culturas * ANOS_DE_VOLUME.length));

    await inserir(dataSource, propriedadesNovas, produtores);

    // Sem estatística nova o Postgres continua planejando para a tabela pequena que ele
    // conhecia, e a medição do plano mediria uma ficção.
    await dataSource.query('VACUUM ANALYZE');

    const depois = await contar(dataSource);

    console.log(
      `Carga de volume: ${depois.propriedades - antes.propriedades} Propriedades e ` +
        `${depois.plantios - antes.plantios} Plantios novos, em ${ANOS_DE_VOLUME.length} Safras ` +
        `e ${culturas} Culturas. A base agora tem ${depois.propriedades} Propriedades e ` +
        `${depois.plantios} Plantios.`,
    );
  });
});

/**
 * Cria as Propriedades e, na mesma instrução, um Plantio para cada cruzamento delas com o
 * catálogo e com os ciclos.
 *
 * As duas inserções andam juntas numa expressão de tabela comum porque a segunda precisa
 * dos identificadores que a primeira sorteia. Como as Propriedades são novas, nenhum dos
 * Plantios pode esbarrar na unicidade da trinca, e a conta fecha exata.
 */
async function inserir(
  dataSource: DataSource,
  propriedades: number,
  produtores: string[],
): Promise<void> {
  await dataSource.query(
    `
      WITH novas AS (
        INSERT INTO propriedades (
          id, produtor_id, cidade, estado, area_total, area_agricultavel, area_de_vegetacao
        )
        SELECT
          gen_random_uuid(),
          ($2::uuid[])[1 + (n % array_length($2::uuid[], 1))],
          'Gleba ' || n,
          ($3::text[])[1 + (n % array_length($3::text[], 1))],
          medida.total,
          round(medida.total * 0.6, 4),
          medida.total - round(medida.total * 0.6, 4)
        FROM generate_series(1, $1) AS n,
             LATERAL (SELECT (50 + (n % 950))::numeric(16, 4) AS total) AS medida
        RETURNING id
      )
      INSERT INTO plantios (id, propriedade_id, cultura_id, safra_id)
      SELECT gen_random_uuid(), novas.id, culturas.id, safras.id
      FROM novas
      CROSS JOIN culturas
      CROSS JOIN (SELECT id FROM safras WHERE ano = ANY($4::int[])) AS safras
    `,
    [propriedades, produtores, [...UNIDADES_FEDERATIVAS], ANOS_DE_VOLUME],
  );
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

async function identificadoresDeProdutor(dataSource: DataSource): Promise<string[]> {
  const linhas: { id: string }[] = await dataSource.query('SELECT id FROM produtores ORDER BY id');

  if (linhas.length === 0) {
    throw new Error(
      'A base não tem nenhum Produtor, e toda Propriedade pende de um. Rode a carga de exemplo antes.',
    );
  }

  return linhas.map((linha) => linha.id);
}

async function quantasCulturas(dataSource: DataSource): Promise<number> {
  const [linha]: { total: string }[] = await dataSource.query('SELECT count(*) AS total FROM culturas');

  return Number(linha?.total ?? 0);
}

async function contar(dataSource: DataSource): Promise<Contagem> {
  const [linha]: { propriedades: string; plantios: string }[] = await dataSource.query(
    `SELECT
       (SELECT count(*) FROM propriedades) AS propriedades,
       (SELECT count(*) FROM plantios) AS plantios`,
  );

  return {
    propriedades: Number(linha?.propriedades ?? 0),
    plantios: Number(linha?.plantios ?? 0),
  };
}
