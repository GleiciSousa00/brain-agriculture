import type { Propriedade } from './propriedade';

/**
 * O recorte que a porta entende.
 *
 * A porta fala em deslocamento e limite, e não em página, porque `domain` não enxerga
 * `shared/application`, que é onde a fatia de listagem mora. Quem converte página em
 * deslocamento é o caso de uso. Ver o registro 0005.
 */
export interface RecorteDePropriedades {
  deslocamento: number;
  limite: number;
}

export interface PropriedadesRecortadas {
  itens: Propriedade[];
  /** Quantas Propriedades existem ao todo, e não quantas vieram neste recorte. */
  total: number;
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
  /** Lista em ordem de cidade, com o identificador desempatando homônimas. */
  list(recorte: RecorteDePropriedades): Promise<PropriedadesRecortadas>;
}

export const PROPRIEDADE_REPOSITORY = Symbol('PropriedadeRepository');
