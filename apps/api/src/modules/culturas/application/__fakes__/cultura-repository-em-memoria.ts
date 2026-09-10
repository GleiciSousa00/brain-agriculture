import type { Cultura } from '../../domain/cultura';
import type { CulturaRepository } from '../../domain/cultura.repository';

/** Repositório substituto dos testes de caso de uso. `__fakes__` fica fora do build. */
export class CulturaRepositoryEmMemoria implements CulturaRepository {
  private readonly culturas: Cultura[] = [];

  async save(cultura: Cultura): Promise<void> {
    this.culturas.push(cultura);
  }

  async findByChave(chave: string): Promise<Cultura | null> {
    return this.culturas.find((cultura) => cultura.chave === chave) ?? null;
  }

  async listAll(): Promise<Cultura[]> {
    // Mesma ordem que o repositório de verdade pede ao banco: byte a byte.
    return [...this.culturas].sort((uma, outra) => (uma.chave < outra.chave ? -1 : 1));
  }
}
