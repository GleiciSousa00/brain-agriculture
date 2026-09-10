import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria a tabela de Produtor.
 *
 * Não existe coluna com o Documento em claro. A unicidade é declarada sobre a impressão,
 * que é determinística; a coluna cifrada não serve para isso porque o nonce do AES-GCM faz
 * o mesmo Documento virar bytes diferentes a cada gravação. Ver o registro 0002.
 */
export class CriaProdutores1789040000000 implements MigrationInterface {
  name = 'CriaProdutores1789040000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "produtores" (
        "id" uuid NOT NULL,
        "nome" character varying(200) NOT NULL,
        "documento_cifrado" text NOT NULL,
        "documento_impressao" character(64) NOT NULL,
        "criado_em" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "pk_produtores" PRIMARY KEY ("id"),
        CONSTRAINT "uq_produtores_documento" UNIQUE ("documento_impressao")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "produtores"`);
  }
}
