import type { Recorte, Recortados } from '../../../shared/domain/recorte';
import type { LigacaoDoPlantio, Plantio } from './plantio';

/** O recorte comum, mais a Propriedade: a listagem é sempre a dela, nunca a do cadastro. */
export interface RecorteDePlantios extends Recorte {
  propriedadeId: string;
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
  listByPropriedade(recorte: RecorteDePlantios): Promise<Recortados<Plantio>>;
}

export const PLANTIO_REPOSITORY = Symbol('PlantioRepository');
