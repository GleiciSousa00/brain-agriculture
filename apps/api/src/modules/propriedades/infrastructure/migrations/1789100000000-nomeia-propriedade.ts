import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Dá nome à Propriedade, e troca a ordem da listagem.
 *
 * A coluna nasce `NOT NULL` sem valor padrão e sem preenchimento retroativo. Uma
 * Propriedade sem nome deixaria de pé o problema que este campo existe para resolver: a
 * tela cairia de volta na cidade justamente no caso em que ela não distingue duas
 * Propriedades. Não há dado em produção, então exigir o campo agora custa nada; um padrão
 * de conveniência, ao contrário, sobreviveria à migração e viraria dado ruim para sempre.
 *
 * O índice de `cidade` sai. Ele existia só para servir à ordem antiga da listagem, e uma
 * coluna que nada mais ordena nem filtra não paga o que um índice cobra em cada escrita.
 * Entra o de `nome`, com o identificador junto, que é a ordem nova, pelo mesmo motivo que
 * o Produtor tem o dele: sem índice, cada página obriga o Postgres a ordenar a tabela
 * inteira antes de descartar tudo menos a fatia pedida.
 */
export class NomeiaPropriedade1789100000000 implements MigrationInterface {
  name = 'NomeiaPropriedade1789100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "propriedades" ADD COLUMN "nome" character varying(200) NOT NULL`,
    );
    await queryRunner.query(`CREATE INDEX "ix_propriedades_nome" ON "propriedades" ("nome", "id")`);
    await queryRunner.query(`DROP INDEX "ix_propriedades_cidade"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "ix_propriedades_cidade" ON "propriedades" ("cidade", "id")`,
    );
    await queryRunner.query(`DROP INDEX "ix_propriedades_nome"`);
    await queryRunner.query(`ALTER TABLE "propriedades" DROP COLUMN "nome"`);
  }
}
