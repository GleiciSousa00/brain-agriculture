import type { Cultura } from './cultura';

/** Porta de persistência do catálogo de Cultura. */
export interface CulturaRepository {
  save(cultura: Cultura): Promise<void>;
  findById(id: string): Promise<Cultura | null>;
  findByChave(chave: string): Promise<Cultura | null>;
  listAll(): Promise<Cultura[]>;
  /**
   * Tira a espécie do catálogo.
   *
   * Levanta `CulturaEmUso` quando algum Plantio ainda aponta para ela. Quem sabe disso é o
   * banco, pela chave estrangeira `ON DELETE RESTRICT`, e não uma consulta feita antes: a
   * consulta responderia sobre o instante anterior à exclusão, e não sobre o dela.
   */
  delete(id: string): Promise<void>;
}

export const CULTURA_REPOSITORY = Symbol('CulturaRepository');
