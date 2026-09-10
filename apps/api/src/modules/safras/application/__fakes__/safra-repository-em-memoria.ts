import type { Safra } from '../../domain/safra';
import type { SafraRepository } from '../../domain/safra.repository';

/** Repositório substituto dos testes de caso de uso. `__fakes__` fica fora do build. */
export class SafraRepositoryEmMemoria implements SafraRepository {
  private readonly safras: Safra[] = [];

  async save(safra: Safra): Promise<void> {
    this.safras.push(safra);
  }

  async findByAno(ano: number): Promise<Safra | null> {
    return this.safras.find((safra) => safra.ano === ano) ?? null;
  }

  async listAll(): Promise<Safra[]> {
    return [...this.safras].sort((uma, outra) => outra.ano - uma.ano);
  }
}
