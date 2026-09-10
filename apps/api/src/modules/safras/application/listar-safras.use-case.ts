import type { Safra } from '../domain/safra';
import type { SafraRepository } from '../domain/safra.repository';

/** Lista as Safras, da mais recente para a mais antiga. */
export class ListarSafrasUseCase {
  constructor(private readonly safras: SafraRepository) {}

  execute(): Promise<Safra[]> {
    return this.safras.listAll();
  }
}
