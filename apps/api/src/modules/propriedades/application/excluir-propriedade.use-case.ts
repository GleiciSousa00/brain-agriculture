import { PropriedadeNaoEncontrada } from '../domain/propriedade.errors';
import type { PropriedadeRepository } from '../domain/propriedade.repository';

/**
 * Remove uma Propriedade, e com ela seus Plantios.
 *
 * A exclusão é física e em cascata, conforme o registro 0003. Quem leva os Plantios junto
 * é a chave estrangeira declarada pela migração de Plantio, e não este caso de uso: ele
 * confere que a Propriedade existe para a resposta poder dizer que não existe, em vez de
 * responder que apagou o que nunca esteve lá.
 */
export class ExcluirPropriedadeUseCase {
  constructor(private readonly propriedades: PropriedadeRepository) {}

  async execute(id: string): Promise<void> {
    if ((await this.propriedades.findById(id)) === null) {
      throw new PropriedadeNaoEncontrada(id);
    }

    await this.propriedades.delete(id);
  }
}
