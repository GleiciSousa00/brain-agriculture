import type { LigacaoDoPlantio, Plantio } from './plantio';

/**
 * O recorte que a porta entende.
 *
 * A porta fala em deslocamento e limite, e não em página, porque `domain` não enxerga
 * `shared/application`, que é onde a fatia de listagem mora. Quem converte página em
 * deslocamento é o caso de uso. Ver o registro 0005.
 */
export interface RecorteDePlantios {
  /** A listagem é sempre a de uma Propriedade, e nunca a do cadastro inteiro. */
  propriedadeId: string;
  deslocamento: number;
  limite: number;
}

export interface PlantiosRecortados {
  itens: Plantio[];
  /** Quantos Plantios a Propriedade tem ao todo, e não quantos vieram neste recorte. */
  total: number;
}

/** Porta de persistência do Plantio. Quem a implementa mora em `infrastructure`. */
export interface PlantioRepository {
  save(plantio: Plantio): Promise<void>;
  findById(id: string): Promise<Plantio | null>;
  /** O Plantio já registrado para essa trinca, se houver. */
  findByLigacao(ligacao: LigacaoDoPlantio): Promise<Plantio | null>;
  delete(id: string): Promise<void>;
  /**
   * Lista os Plantios de uma Propriedade, na ordem em que foram registrados.
   *
   * Ordenar pelos identificadores de Cultura e de Safra também seria estável, mas eles são
   * opacos, e a ordem não diria nada a quem opera. A ordem de registro diz. Como ela não
   * está no domínio, quem a guarda é a coluna de criação, e o identificador desempata as
   * linhas gravadas na mesma transação.
   */
  listByPropriedade(recorte: RecorteDePlantios): Promise<PlantiosRecortados>;
}

export const PLANTIO_REPOSITORY = Symbol('PlantioRepository');
