import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * A unicidade é sobre a chave de comparação, não sobre o nome digitado. É o que impede
 * "Café", "cafe" e "CAFÉ" de virarem três linhas.
 */
@Entity({ name: 'culturas' })
export class CulturaOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  nome!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  chave!: string;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm!: Date;
}
