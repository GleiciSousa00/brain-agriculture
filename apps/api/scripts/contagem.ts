import type { DataSource } from 'typeorm';

/** As tabelas que a carga enche e a medição mede. */
export type Contagem = Record<string, number>;

/**
 * Quantas linhas cada tabela tem, numa consulta só.
 *
 * A carga de volume usa isto para dizer quanto acrescentou, e a medição para dizer contra
 * que volume ela mediu. Os dois precisam do mesmo número, e um número que discorda de si
 * mesmo entre dois comandos não serve para registrar medição nenhuma.
 */
export async function contarLinhas(dataSource: DataSource): Promise<Contagem> {
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
