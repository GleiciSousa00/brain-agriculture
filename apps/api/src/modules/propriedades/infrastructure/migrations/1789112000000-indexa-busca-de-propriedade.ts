import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Índice da busca por nome da Propriedade.
 *
 * Mesmo motivo do índice de Produtor: o campo de escolha procura por pedaço do meio da
 * palavra, e é o índice de trigramas que responde a isso sem varrer a tabela.
 */
export class IndexaBuscaDePropriedade1789112000000 implements MigrationInterface {
  name = 'IndexaBuscaDePropriedade1789112000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "ix_propriedades_busca" ON "propriedades" USING gin ("texto_para_busca"("nome") gin_trgm_ops)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "ix_propriedades_busca"`);
  }
}
