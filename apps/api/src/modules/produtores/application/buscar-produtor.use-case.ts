import type { Propriedade } from '../../propriedades/domain/propriedade';
import type { Produtor } from '../domain/produtor';
import { ProdutorNaoEncontrado } from '../domain/produtor.errors';
import type { ProdutorRepository } from '../domain/produtor.repository';
import type { PropriedadesDoProdutorRepository } from '../domain/propriedades-do-produtor.repository';

/** O cadastro inteiro de um Produtor, que é ele e as Propriedades em nome dele. */
export interface ProdutorComPropriedades {
  produtor: Produtor;
  propriedades: Propriedade[];
}

/**
 * Recupera o cadastro de um Produtor, ou recusa dizendo que ele não existe.
 *
 * As Propriedades vêm junto porque a operadora confere o cadastro de uma vez, e não vale a
 * pena uma segunda requisição para saber onde o Produtor produz. A lista vazia é resposta
 * legítima: um Produtor pode existir sem nenhuma Propriedade.
 */
export class BuscarProdutorUseCase {
  constructor(
    private readonly produtores: ProdutorRepository,
    private readonly propriedades: PropriedadesDoProdutorRepository,
  ) {}

  async execute(id: string): Promise<ProdutorComPropriedades> {
    const produtor = await this.produtores.findById(id);

    if (produtor === null) {
      throw new ProdutorNaoEncontrado(id);
    }

    return { produtor, propriedades: await this.propriedades.listByProdutor(id) };
  }
}
