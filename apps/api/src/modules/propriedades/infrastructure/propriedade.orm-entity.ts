import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * O desenho da tabela, que não é o desenho do domínio.
 *
 * As três áreas são `numeric`, e não ponto flutuante: hectare é medida, e medida somada em
 * ponto flutuante acumula resíduo. O driver devolve `numeric` como texto, e é o tradutor
 * quem converte.
 *
 * Não existe relação declarada com o Produtor. A coluna guarda o identificador, e a chave
 * estrangeira mora na migração: declarar a relação aqui obrigaria esta camada a enxergar a
 * entidade de ORM de outro módulo, o que o registro 0005 proíbe.
 */
@Entity({ name: 'propriedades' })
export class PropriedadeOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Index()
  @Column({ name: 'produtor_id', type: 'uuid' })
  produtorId!: string;

  /** A listagem ordena por esta coluna. O índice que a serve vem da migração. */
  @Column({ type: 'varchar', length: 200 })
  nome!: string;

  @Column({ type: 'varchar', length: 120 })
  cidade!: string;

  /** O painel agrupa por esta coluna, e por isso ela é indexada. Ver o registro 0004. */
  @Index()
  @Column({ type: 'char', length: 2 })
  estado!: string;

  @Column({ name: 'area_total', type: 'numeric', precision: 16, scale: 4 })
  areaTotal!: string;

  @Column({ name: 'area_agricultavel', type: 'numeric', precision: 16, scale: 4 })
  areaAgricultavel!: string;

  @Column({ name: 'area_de_vegetacao', type: 'numeric', precision: 16, scale: 4 })
  areaDeVegetacao!: string;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm!: Date;
}
