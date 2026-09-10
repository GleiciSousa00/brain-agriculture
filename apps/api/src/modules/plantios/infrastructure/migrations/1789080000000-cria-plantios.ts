import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria a tabela de Plantio, que é o que liga Cultura, Propriedade e Safra.
 *
 * A chave estrangeira para a Propriedade é `ON DELETE CASCADE`: excluir uma Propriedade
 * apaga os Plantios dela, e excluir um Produtor apaga as Propriedades e, por essa cascata,
 * os Plantios. É a exclusão física do registro 0003 chegando até a ponta.
 *
 * As chaves para a Cultura e para a Safra são `ON DELETE RESTRICT`, e de propósito: a
 * Cultura vive num catálogo compartilhado e a Safra é comum a todas as Propriedades.
 * Apagar uma delas apagaria em silêncio o Plantio de outra pessoa, e o certo é recusar.
 *
 * As três restrições são nomeadas porque o repositório se apoia no nome para dizer qual
 * das três referências não existe. Renomear uma aqui quebra a tradução lá.
 *
 * A restrição de unicidade é sobre a trinca. Ela recusa a mesma Cultura duas vezes na
 * mesma Propriedade na mesma Safra, e é o que fecha a janela entre a consulta prévia do
 * caso de uso e a gravação. O índice que ela cria começa por `propriedade_id`, e é ele que
 * atende o filtro da listagem. A ordem da listagem, que é a de registro, não é indexada:
 * uma Propriedade tem poucos Plantios, um por Cultura em cada Safra.
 *
 * `cultura_id` recebe índice próprio porque o painel conta os Plantios por Cultura, e o
 * registro 0004 manda indexar a coluna agrupada. `safra_id` não recebe: a Safra só vira
 * dimensão no gráfico por Cultura, e o índice que esse recorte pedir entra com a consulta
 * que o pedir.
 */
export class CriaPlantios1789080000000 implements MigrationInterface {
  name = 'CriaPlantios1789080000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plantios" (
        "id" uuid NOT NULL,
        "propriedade_id" uuid NOT NULL,
        "cultura_id" uuid NOT NULL,
        "safra_id" uuid NOT NULL,
        "criado_em" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "pk_plantios" PRIMARY KEY ("id"),
        CONSTRAINT "uq_plantios_ligacao" UNIQUE ("propriedade_id", "cultura_id", "safra_id"),
        CONSTRAINT "fk_plantios_propriedade" FOREIGN KEY ("propriedade_id")
          REFERENCES "propriedades" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_plantios_cultura" FOREIGN KEY ("cultura_id")
          REFERENCES "culturas" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_plantios_safra" FOREIGN KEY ("safra_id")
          REFERENCES "safras" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "ix_plantios_cultura" ON "plantios" ("cultura_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "plantios"`);
  }
}
