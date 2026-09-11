import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Índice da busca por nome do Produtor.
 *
 * O índice de ordenação não serve aqui: procurar por pedaço do meio da palavra não tem
 * prefixo por onde começar, e o Postgres cairia na varredura da tabela a cada tecla
 * digitada. O índice de trigramas é o que responde a `LIKE '%termo%'` sem varrer.
 */
export class IndexaBuscaDeProdutor1789111000000 implements MigrationInterface {
  name = 'IndexaBuscaDeProdutor1789111000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "ix_produtores_busca" ON "produtores" USING gin ("texto_para_busca"("nome") gin_trgm_ops)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "ix_produtores_busca"`);
  }
}
