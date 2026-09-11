import type { RecorteComBusca, Recortados } from '../../../shared/domain/recorte';
import type { Propriedade } from './propriedade';

/**
 * O recorte da listagem de Propriedades.
 *
 * Além do nome procurado, ela aceita um punhado de identificadores. É assim que a tela
 * resolve a Propriedade que o endereço aponta sem depender de uma lista carregada de
 * antemão, conforme o registro de decisão 0013.
 */
export interface RecorteDePropriedades extends RecorteComBusca {
  /** Os identificadores pedidos. Ausente, lista todas; vazio, não lista nenhuma. */
  ids?: string[];
}

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
  /** Lista em ordem de nome, com o identificador desempatando homônimas. */
  list(recorte: RecorteDePropriedades): Promise<Recortados<Propriedade>>;
}

export const PROPRIEDADE_REPOSITORY = Symbol('PropriedadeRepository');
