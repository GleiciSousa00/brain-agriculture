import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Índice sobre a Safra e a Cultura do Plantio.
 *
 * Ele entra com a consulta que o pede, que é a do painel: a migração de Plantio deixou
 * `safra_id` sem índice de propósito, porque a Safra só vira dimensão aqui.
 *
 * A ordem das colunas é a da consulta: ela filtra por Safra e agrupa por Cultura, então o
 * índice começa pelo filtro e serve o agrupamento na sequência. Sem o filtro, quem serve o
 * agrupamento é `ix_plantios_cultura`, criado com a tabela.
 *
 * A migração mora no módulo de painel, e não no de Plantio, porque o índice existe pela
 * consulta do painel e sai junto com ela se ela sair. Ela toca a tabela de outro módulo, o
 * que uma migração pode fazer: o registro 0005 fala de importação entre camadas, e aqui
 * não há importação nenhuma, só SQL.
 */
export class IndexaSafraDePlantio1789090000000 implements MigrationInterface {
  name = 'IndexaSafraDePlantio1789090000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "ix_plantios_safra_cultura" ON "plantios" ("safra_id", "cultura_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "ix_plantios_safra_cultura"`);
  }
}
