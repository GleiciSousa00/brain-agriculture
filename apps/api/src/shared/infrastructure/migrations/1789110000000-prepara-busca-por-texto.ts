import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * O que faz duas grafias do mesmo nome se encontrarem.
 *
 * Quem procura digita "jose" e o cadastro guarda "José": sem dobrar caixa e acento, a
 * busca por nome erra justamente os nomes brasileiros. `texto_para_busca` é a dobra, e é
 * ela que a consulta aplica dos dois lados — no que está gravado e no que se digitou.
 *
 * A função precisa ser declarada imutável para poder ser indexada. `unaccent` não é, por
 * depender do dicionário carregado, e por isso a chamada fixa o dicionário: com ele
 * nomeado, o resultado passa a depender só da entrada.
 *
 * `pg_trgm` entra junto porque é ele que indexa a busca por pedaço do meio da palavra.
 * Sem ele o `LIKE '%termo%'` varre a tabela inteira a cada tecla digitada.
 */
export class PreparaBuscaPorTexto1789110000000 implements MigrationInterface {
  name = 'PreparaBuscaPorTexto1789110000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION "texto_para_busca"("texto" text)
      RETURNS text
      LANGUAGE sql
      IMMUTABLE
      STRICT
      PARALLEL SAFE
      RETURN lower(unaccent('unaccent', "texto"))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION IF EXISTS "texto_para_busca"(text)`);
  }
}
