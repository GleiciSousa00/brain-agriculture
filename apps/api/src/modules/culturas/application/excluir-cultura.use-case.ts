import { CulturaNaoEncontrada } from '../domain/cultura.errors';
import type { CulturaRepository } from '../domain/cultura.repository';

/**
 * Tira uma espécie do catálogo.
 *
 * O catálogo é editável por quem opera, e um nome digitado errado ficava para sempre: sem
 * exclusão, a única saída era recriar a base. A exclusão existe para isso, e não para
 * apagar histórico — a Cultura que já está num Plantio é recusada pelo repositório, com o
 * `CulturaEmUso` que a chave estrangeira `ON DELETE RESTRICT` provoca.
 *
 * A única regra daqui é recusar identificador inexistente.
 */
export class ExcluirCulturaUseCase {
  constructor(private readonly culturas: CulturaRepository) {}

  async execute(id: string): Promise<void> {
    if ((await this.culturas.findById(id)) === null) {
      throw new CulturaNaoEncontrada(id);
    }

    await this.culturas.delete(id);
  }
}
