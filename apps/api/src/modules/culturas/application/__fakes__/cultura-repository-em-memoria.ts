import type { Cultura } from '../../domain/cultura';
import { CulturaEmUso } from '../../domain/cultura.errors';
import type { CulturaRepository } from '../../domain/cultura.repository';

/**
 * Repositório substituto dos testes de caso de uso. `__fakes__` fica fora do build.
 *
 * Ele repete a recusa que no banco vem da chave estrangeira: tirar do catálogo a espécie
 * que algum Plantio aponta. É o caminho difícil de provocar contra banco de verdade, e
 * quem diz que a espécie está plantada é o teste, por `plantar`.
 */
export class CulturaRepositoryEmMemoria implements CulturaRepository {
  private readonly culturas: Cultura[] = [];
  private readonly plantadas = new Set<string>();

  /** Marca a espécie como apontada por algum Plantio, sem precisar de módulo de Plantio. */
  plantar(id: string): void {
    this.plantadas.add(id);
  }

  async save(cultura: Cultura): Promise<void> {
    this.culturas.push(cultura);
  }

  async findById(id: string): Promise<Cultura | null> {
    return this.culturas.find((cultura) => cultura.id === id) ?? null;
  }

  async findByChave(chave: string): Promise<Cultura | null> {
    return this.culturas.find((cultura) => cultura.chave === chave) ?? null;
  }

  async listAll(): Promise<Cultura[]> {
    return [...this.culturas].sort((uma, outra) => (uma.chave < outra.chave ? -1 : 1));
  }

  async delete(id: string): Promise<void> {
    if (this.plantadas.has(id)) {
      throw new CulturaEmUso();
    }

    const posicao = this.culturas.findIndex((cultura) => cultura.id === id);

    if (posicao >= 0) {
      this.culturas.splice(posicao, 1);
    }
  }
}
