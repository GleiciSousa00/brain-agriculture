import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Índice sobre o nome do Produtor.
 *
 * A listagem sai ordenada por nome, e sem índice cada página obriga o Postgres a ordenar
 * a tabela inteira antes de descartar tudo menos a fatia pedida. É o que separa uma
 * listagem que continua utilizável com muitos registros de uma que não.
 */
export class IndexaNomeDeProdutor1789065000000 implements MigrationInterface {
  name = 'IndexaNomeDeProdutor1789065000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "ix_produtores_nome" ON "produtores" ("nome", "id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "ix_produtores_nome"`);
  }
}
