import type { Cultura } from './cultura';

/** Porta de persistência do catálogo de Cultura. */
export interface CulturaRepository {
  save(cultura: Cultura): Promise<void>;
  findByChave(chave: string): Promise<Cultura | null>;
  listAll(): Promise<Cultura[]>;
}

export const CULTURA_REPOSITORY = Symbol('CulturaRepository');
