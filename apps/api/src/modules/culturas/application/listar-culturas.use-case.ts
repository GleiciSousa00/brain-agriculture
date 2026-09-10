import type { Cultura } from '../domain/cultura';
import type { CulturaRepository } from '../domain/cultura.repository';

/** Lista o catálogo em ordem alfabética. */
export class ListarCulturasUseCase {
  constructor(private readonly culturas: CulturaRepository) {}

  execute(): Promise<Cultura[]> {
    return this.culturas.listAll();
  }
}
