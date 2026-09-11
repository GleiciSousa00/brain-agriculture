import type { Safra } from './safra';

/** Porta de persistência da Safra. */
export interface SafraRepository {
  save(safra: Safra): Promise<void>;
  findById(id: string): Promise<Safra | null>;
  findByAno(ano: number): Promise<Safra | null>;
  listAll(): Promise<Safra[]>;
  /**
   * Tira a Safra do cadastro.
   *
   * Levanta `SafraEmUso` quando algum Plantio ainda aponta para ela. Quem sabe disso é o
   * banco, pela chave estrangeira `ON DELETE RESTRICT`, e não uma consulta feita antes: a
   * consulta responderia sobre o instante anterior à exclusão, e não sobre o dela.
   */
  delete(id: string): Promise<void>;
}

export const SAFRA_REPOSITORY = Symbol('SafraRepository');
