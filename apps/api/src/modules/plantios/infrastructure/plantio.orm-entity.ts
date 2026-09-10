import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

/**
 * O desenho da tabela, que não é o desenho do domínio.
 *
 * Não existe relação declarada com Propriedade, Cultura nem Safra. As colunas guardam os
 * identificadores, e as três chaves estrangeiras moram na migração: declarar a relação
 * aqui obrigaria esta camada a enxergar a entidade de ORM de outro módulo, o que o
 * registro 0005 proíbe.
 *
 * A restrição de unicidade é sobre a trinca inteira. Ela é o que recusa a mesma Cultura
 * duas vezes na mesma Propriedade na mesma Safra, sem impedir a segunda Cultura, que é o
 * caso normal.
 */
@Entity({ name: 'plantios' })
@Unique('uq_plantios_ligacao', ['propriedadeId', 'culturaId', 'safraId'])
export class PlantioOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'propriedade_id', type: 'uuid' })
  propriedadeId!: string;

  /** O painel conta os Plantios por esta coluna, e por isso ela é indexada. Registro 0004. */
  @Index()
  @Column({ name: 'cultura_id', type: 'uuid' })
  culturaId!: string;

  @Column({ name: 'safra_id', type: 'uuid' })
  safraId!: string;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm!: Date;
}
