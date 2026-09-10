import type { Recorte, Recortados } from '../../../shared/domain/recorte';
import type { Propriedade } from './propriedade';

/** Porta de persistência da Propriedade. Quem a implementa mora em `infrastructure`. */
export interface PropriedadeRepository {
  save(propriedade: Propriedade): Promise<void>;
  findById(id: string): Promise<Propriedade | null>;
  /**
   * Remove a Propriedade e, com ela, seus Plantios.
   *
   * A remoção do Plantio é física e vem da chave estrangeira que a migração de Plantio
   * declara, conforme o registro 0003. Este módulo não a enxerga, e não precisa: o banco
   * leva os Plantios junto sozinho.
   */
  delete(id: string): Promise<void>;
  /** Lista em ordem de cidade, com o identificador desempatando homônimas. */
  list(recorte: Recorte): Promise<Recortados<Propriedade>>;
}

export const PROPRIEDADE_REPOSITORY = Symbol('PropriedadeRepository');
