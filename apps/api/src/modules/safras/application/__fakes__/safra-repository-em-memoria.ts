import type { Safra } from '../../domain/safra';
import { SafraEmUso } from '../../domain/safra.errors';
import type { SafraRepository } from '../../domain/safra.repository';

/**
 * Repositório substituto dos testes de caso de uso. `__fakes__` fica fora do build.
 *
 * Ele repete a recusa que no banco vem da chave estrangeira: tirar do cadastro a Safra
 * que algum Plantio aponta. É o caminho difícil de provocar contra banco de verdade, e
 * quem diz que a Safra tem Plantio é o teste, por `plantar`.
 */
export class SafraRepositoryEmMemoria implements SafraRepository {
  private readonly safras: Safra[] = [];
  private readonly plantadas = new Set<string>();

  /** Marca a Safra como apontada por algum Plantio, sem precisar de módulo de Plantio. */
  plantar(id: string): void {
    this.plantadas.add(id);
  }

  async save(safra: Safra): Promise<void> {
    this.safras.push(safra);
  }

  async findById(id: string): Promise<Safra | null> {
    return this.safras.find((safra) => safra.id === id) ?? null;
  }

  async findByAno(ano: number): Promise<Safra | null> {
    return this.safras.find((safra) => safra.ano === ano) ?? null;
  }

  async listAll(): Promise<Safra[]> {
    return [...this.safras].sort((uma, outra) => outra.ano - uma.ano);
  }

  async delete(id: string): Promise<void> {
    if (this.plantadas.has(id)) {
      throw new SafraEmUso();
    }

    const posicao = this.safras.findIndex((safra) => safra.id === id);

    if (posicao >= 0) {
      this.safras.splice(posicao, 1);
    }
  }
}
