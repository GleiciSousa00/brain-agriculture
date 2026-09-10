import type { Safra } from './safra';

/** Porta de persistência da Safra. */
export interface SafraRepository {
  save(safra: Safra): Promise<void>;
  findByAno(ano: number): Promise<Safra | null>;
  listAll(): Promise<Safra[]>;
}

export const SAFRA_REPOSITORY = Symbol('SafraRepository');
