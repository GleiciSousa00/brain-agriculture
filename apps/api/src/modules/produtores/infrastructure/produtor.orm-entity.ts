import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * O desenho da tabela, que não é o desenho do domínio.
 *
 * O Documento não tem coluna em claro. Existem duas colunas derivadas dele, conforme o
 * registro 0002: a cifrada, para exibição, e a impressão determinística, que é onde a
 * restrição de unicidade pode existir.
 */
@Entity({ name: 'produtores' })
export class ProdutorOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  nome!: string;

  @Column({ name: 'documento_cifrado', type: 'text' })
  documentoCifrado!: string;

  @Column({ name: 'documento_impressao', type: 'char', length: 64, unique: true })
  documentoImpressao!: string;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm!: Date;
}
