import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria a tabela de Safra.
 *
 * A unicidade é sobre o ano: a Safra é compartilhada por todas as Propriedades, então
 * existe uma por ciclo e não uma por Propriedade.
 */
export class CriaSafras1789050000000 implements MigrationInterface {
  name = 'CriaSafras1789050000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "safras" (
        "id" uuid NOT NULL,
        "ano" integer NOT NULL,
        "criado_em" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "pk_safras" PRIMARY KEY ("id"),
        CONSTRAINT "uq_safras_ano" UNIQUE ("ano")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "safras"`);
  }
}
