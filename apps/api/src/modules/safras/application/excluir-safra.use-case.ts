import { SafraNaoEncontrada } from '../domain/safra.errors';
import type { SafraRepository } from '../domain/safra.repository';

/**
 * Tira uma Safra do cadastro.
 *
 * A Safra é criada por quem opera, e um ano digitado errado ficava para sempre: sem
 * exclusão, a única saída era recriar a base. A exclusão existe para isso, e não para
 * apagar histórico — a Safra que já tem Plantio é recusada pelo repositório, com o
 * `SafraEmUso` que a chave estrangeira `ON DELETE RESTRICT` provoca.
 *
 * A única regra daqui é recusar identificador inexistente.
 */
export class ExcluirSafraUseCase {
  constructor(private readonly safras: SafraRepository) {}

  async execute(id: string): Promise<void> {
    if ((await this.safras.findById(id)) === null) {
      throw new SafraNaoEncontrada(id);
    }

    await this.safras.delete(id);
  }
}
