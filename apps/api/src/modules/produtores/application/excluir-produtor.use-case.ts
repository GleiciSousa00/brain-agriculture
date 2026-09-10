import { ProdutorNaoEncontrado } from '../domain/produtor.errors';
import type { ProdutorRepository } from '../domain/produtor.repository';
import type { PropriedadesDoProdutorRepository } from '../domain/propriedades-do-produtor.repository';

/**
 * Apaga um Produtor e tudo que pendia dele.
 *
 * A exclusão é física e em cascata, conforme o registro 0003: não há exclusão lógica nem
 * anonimização, porque o que o titular pediu foi que o dado deixasse de existir.
 *
 * A cascata é orquestrada aqui, e não deixada só para o banco, para que ela seja afirmável
 * sem Postgres de pé. A chave estrangeira com `ON DELETE CASCADE` continua valendo como
 * rede de baixo, do mesmo jeito que a restrição de unicidade vale sob a conferência de
 * Documento duplicado.
 */
export class ExcluirProdutorUseCase {
  constructor(
    private readonly produtores: ProdutorRepository,
    private readonly propriedades: PropriedadesDoProdutorRepository,
  ) {}

  async execute(id: string): Promise<void> {
    if ((await this.produtores.findById(id)) === null) {
      throw new ProdutorNaoEncontrado(id);
    }

    await this.propriedades.deleteByProdutor(id);
    await this.produtores.delete(id);
  }
}
