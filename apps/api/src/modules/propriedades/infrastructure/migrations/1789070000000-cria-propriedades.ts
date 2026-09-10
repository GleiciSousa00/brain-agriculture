import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria a tabela de Propriedade.
 *
 * A chave estrangeira para o Produtor é `ON DELETE CASCADE`: excluir um Produtor apaga as
 * Propriedades dele, em exclusão física, conforme o registro 0003. Ela é a rede de baixo
 * da cascata que o caso de uso de exclusão também faz, e é o que garante que nada fica
 * órfão mesmo se a exclusão vier por outro caminho.
 *
 * As áreas são `numeric(16,4)`: quatro casas decimais em hectare são o metro quadrado, que
 * é a precisão do cadastro rural, e a coluna comporta mil vezes o teto que o domínio impõe.
 * A coluna acompanha a medida, e não o contrário.
 *
 * Há restrição de não negatividade em cada uma: a regra da soma vive na entidade, mas área
 * negativa é dado impossível, e o banco é o último lugar onde isso pode ser barrado.
 *
 * `estado` e `produtor_id` recebem índice porque o painel agrupa pelo primeiro e o cadastro
 * do Produtor filtra pelo segundo. Ver o registro 0004. `cidade` recebe índice porque é a
 * ordem da listagem paginada.
 */
export class CriaPropriedades1789070000000 implements MigrationInterface {
  name = 'CriaPropriedades1789070000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "propriedades" (
        "id" uuid NOT NULL,
        "produtor_id" uuid NOT NULL,
        "cidade" character varying(120) NOT NULL,
        "estado" character(2) NOT NULL,
        "area_total" numeric(16,4) NOT NULL,
        "area_agricultavel" numeric(16,4) NOT NULL,
        "area_de_vegetacao" numeric(16,4) NOT NULL,
        "criado_em" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "pk_propriedades" PRIMARY KEY ("id"),
        CONSTRAINT "ck_propriedades_areas_nao_negativas" CHECK (
          "area_total" >= 0 AND "area_agricultavel" >= 0 AND "area_de_vegetacao" >= 0
        ),
        CONSTRAINT "fk_propriedades_produtor" FOREIGN KEY ("produtor_id")
          REFERENCES "produtores" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_propriedades_produtor" ON "propriedades" ("produtor_id")`,
    );
    await queryRunner.query(`CREATE INDEX "ix_propriedades_estado" ON "propriedades" ("estado")`);
    // A listagem ordena por cidade, com o identificador desempatando. Sem índice a ordem
    // custa uma ordenação da tabela inteira a cada página.
    await queryRunner.query(
      `CREATE INDEX "ix_propriedades_cidade" ON "propriedades" ("cidade", "id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "propriedades"`);
  }
}
