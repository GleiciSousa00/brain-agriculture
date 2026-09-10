import type { Produtor } from '../domain/produtor';
import { ProdutorNaoEncontrado } from '../domain/produtor.errors';
import type { ProdutorRepository } from '../domain/produtor.repository';

/** Recupera um Produtor pelo identificador, ou recusa dizendo que ele não existe. */
export class BuscarProdutorUseCase {
  constructor(private readonly produtores: ProdutorRepository) {}

  async execute(id: string): Promise<Produtor> {
    const produtor = await this.produtores.findById(id);

    if (produtor === null) {
      throw new ProdutorNaoEncontrado(id);
    }

    return produtor;
  }
}
