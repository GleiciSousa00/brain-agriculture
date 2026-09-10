import type { MigrationInterface, QueryRunner } from 'typeorm';
import { linhasIniciais } from '../culturas-iniciais';

/**
 * Cria o catálogo de Cultura e faz a carga inicial.
 *
 * A carga vem da lista em TypeScript, com a chave calculada pela regra do domínio, para
 * que uma espécie semeada aqui não possa divergir de uma acrescentada pela API.
 */
export class CriaCulturas1789060000000 implements MigrationInterface {
  name = 'CriaCulturas1789060000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "culturas" (
        "id" uuid NOT NULL,
        "nome" character varying(100) NOT NULL,
        "chave" character varying(100) NOT NULL,
        "criado_em" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "pk_culturas" PRIMARY KEY ("id"),
        CONSTRAINT "uq_culturas_chave" UNIQUE ("chave")
      )
    `);

    for (const { nome, chave } of linhasIniciais()) {
      await queryRunner.query(
        `INSERT INTO "culturas" ("id", "nome", "chave") VALUES (gen_random_uuid(), $1, $2)`,
        [nome, chave],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "culturas"`);
  }
}
