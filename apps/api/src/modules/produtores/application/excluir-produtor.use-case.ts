import { ProdutorNaoEncontrado } from '../domain/produtor.errors';
import type { ProdutorRepository } from '../domain/produtor.repository';

/**
 * Apaga um Produtor e tudo que pendia dele.
 *
 * A exclusão é física e em cascata, conforme o registro 0003: não há exclusão lógica nem
 * anonimização, porque o que o titular pediu foi que o dado deixasse de existir.
 *
 * A cascata é só da chave estrangeira `ON DELETE CASCADE` que a migração
 * `1789070000000-cria-propriedades` declara (e, dali, a que `1789080000000-cria-plantios`
 * declara para o Plantio): o banco apaga Propriedade e Plantio na mesma instrução que apaga
 * o Produtor. A única regra deste caso de uso é recusar identificador inexistente.
 */
export class ExcluirProdutorUseCase {
  constructor(private readonly produtores: ProdutorRepository) {}

  async execute(id: string): Promise<void> {
    if ((await this.produtores.findById(id)) === null) {
      throw new ProdutorNaoEncontrado(id);
    }

    await this.produtores.delete(id);
  }
}
